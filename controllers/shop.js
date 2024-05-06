const fs = require("fs");
const path = require("path");

const PDFDocument = require("pdfkit");
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_KEY);

const Product = require("../models/product");
const User = require("../models/user");
const Order = require("../models/order");
const { error } = require("console");

const ITEMS_PER_PAGE = 4;

let maxPrice;
let minPrice;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  // First, find the total number of products
  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      // Next, find the products for the current page
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      // After fetching the products, find the maximum and minimum prices
      return Product.aggregate([
        {
          $group: {
            _id: null,
            maxPrice: { $max: "$price" },
            minPrice: { $min: "$price" },
          },
        },
      ]).then((result) => {
        maxPrice = result[0].maxPrice;
        minPrice = result[0].minPrice;
        return products;
      });
    })
    .then((products) => {
      // Render the product list page with products, max price, and min price
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        maxPrice: maxPrice,
        minPrice: minPrice,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then((product) => {
      User.findById(product.userId)
        .then((user) => {
          const userDetails = {
            userId: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
          };

          res.render("shop/product-detail", {
            user: userDetails,
            product: product,
            pageTitle: product.title,
            path: "/products",
          });
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getFilteredProducts = (req, res, next) => {
  const page = +req.query.page || 1;

  const searchTerm = req.query.searchTerm || "";
  const low = parseInt(req.query.low) || 0;
  const high = parseInt(req.query.high) || Infinity;

  const filter = {
    $or: [
      { title: { $regex: searchTerm, $options: "i" } },
      { description: { $regex: searchTerm, $options: "i" } },
    ],
    price: { $gte: low, $lte: high },
  };

  Product.find(filter)
    .countDocuments()
    .then((totalItems) => {
      console.log(totalItems);
      return Product.find(filter)
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .then((products) => {
          res.render("shop/product-list", {
            prods: products,
            pageTitle: "Products",
            path: "/products",
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
            maxPrice: maxPrice,
            minPrice: minPrice,
          });
        });
    })
    .catch((err) => {
      console.log("Error fetching filtered products:", err);

      console.error("Error fetching filtered products:", err);
      const error = new Error(
        "An error occurred while fetching filtered products."
      );
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  res.render("shop/index", {
    pageTitle: "Shop",
    path: "/",
    error: "",
  });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product, "add");
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.updateCart = (req, res, next) => {
  const productId = req.params.productId;
  const action = req.query.action;

  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (action === "add" || action === "remove") {
        req.user
          .addToCart(product._id, action === "add" ? "add" : "remove")
          .then(() => {
            return res
              .status(200)
              .json({
                quantity: req.user.cart.items.find(
                  (item) => item.productId.toString() === productId.toString()
                ).quantity,
              });
          })
          .catch((err) => {
            console.error("Error updating cart:", err);
            return res.status(500).json({ error: "Internal server error" });
          });
      } else {
        return res.status(400).json({ error: "Invalid action" });
      }
    })
    .catch((err) => {
      console.error("Error finding product:", err);
      return res.status(500).json({ error: "Internal server error" });
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      let total = 0;
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: products,
        totalSum: total,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  // Token is created using Checkout or Elements!
  // Get the payment token ID submitted by the form:
  const token = req.body.stripeToken; // Using Express
  let totalSum = 0;

  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      user.cart.items.forEach((p) => {
        totalSum += p.quantity * p.productId.price;
      });

      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      const charge = stripe.charges.create({
        amount: totalSum * 100,
        currency: "usd",
        description: "Demo Order",
        source: token,
        metadata: { order_id: result._id.toString() },
      });
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found."));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
      });
      pdfDoc.text("-----------------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              " - " +
              prod.quantity +
              " x " +
              "$" +
              prod.product.price
          );
      });
      pdfDoc.text("---");
      pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);

      pdfDoc.end();
    })
    .catch((err) => next(err));
};

exports.getVendorProfile = (req, res, next) => {
  const userId = req.params.userId;
  const page = +req.query.page || 1;
  let totalItems;
  let totalUserProducts;

  let prodsPromise = Product.find({ userId: userId })
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .exec();

  let userPromise = User.findById(userId).exec();

  let userProductsCountPromise = Product.find({ userId: userId })
    .countDocuments()
    .exec();

  let totalProductsCountPromise = Product.find().countDocuments().exec();

  Promise.all([
    prodsPromise,
    userPromise,
    userProductsCountPromise,
    totalProductsCountPromise,
  ])
    .then(
      ([productsWithUserId, user, userProductsCount, totalProductsCount]) => {
        if (!user) {
          throw new Error("No user found.");
        }
        totalItems = totalProductsCount;
        if (userProductsCount.length > 0) {
          totalUserProducts = userProductsCount;
        } else {
          totalUserProducts = 0;
        }
        res.render("shop/profile", {
          path: "/profile",
          user: user,
          pageTitle: user.firstName + "'s profile",
          products: productsWithUserId,
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
          totalUserProducts: totalUserProducts,
        });
      }
    )
    .catch((err) => next(err));
};
