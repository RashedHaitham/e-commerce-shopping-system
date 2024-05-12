const path = require("path");

const express = require("express");

const shopController = require("../controllers/shop");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/", shopController.getIndex);

router.get("/products", shopController.getProducts);

router.get("/products/:productId", shopController.getProduct);

router.get("/user/profile/:userId", shopController.getVendorProfile);

router.get("/filtered/products", shopController.getFilteredProducts);

router.get("/cart", isAuth, shopController.getCart);

router.post("/cart", isAuth, shopController.postCart);

router.get("/update-cart/:productId", isAuth, shopController.updateCart);

router.post("/cart-delete-item", isAuth, shopController.postCartDeleteProduct);

router.get("/checkout", isAuth, shopController.getCheckout);

router.get("/orders", isAuth, shopController.getOrders);

router.get("/orders/:orderId", isAuth, shopController.getInvoice);

router.get("/product/reviews/:productId", isAuth, shopController.getReviews);

router.post("/product/reviews", isAuth, shopController.postReviews);

router.post("/product-orders/chat", isAuth, shopController.chat);

module.exports = router;
