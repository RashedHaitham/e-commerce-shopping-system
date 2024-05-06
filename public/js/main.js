// year
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const yearElement = document.getElementById("current-year");
yearElement.textContent = currentYear;
//end year

//plus minus
document.addEventListener("DOMContentLoaded", function () {
  const quantitySpan = document.querySelector(".quantity");
  const btnPlus = document.querySelector(".btn-plus");
  const btnMinus = document.querySelector(".btn-minus");

  btnPlus.addEventListener("click", function () {
    let quantity = parseInt(quantitySpan.textContent);
    quantity++;
    quantitySpan.textContent = quantity;
    const productId = btnPlus.getAttribute("data-product-id");
    updateCart(productId, "add");
  });

  btnMinus.addEventListener("click", function () {
    let quantity = parseInt(quantitySpan.textContent);
    if (quantity > 0) {
      quantity--;
      quantitySpan.textContent = quantity;
    }
    const productId = btnMinus.getAttribute("data-product-id");
    updateCart(productId, "remove");
  });

  function updateCart(productId, action) {
    console.log(productId);
    fetch(`/update-cart/${productId}?action=${action}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .catch((error) => console.log("Error:", error));
  }
});
//end plus minus

//slider func
const lowerSlider = document.getElementById("lowerSlider");
const upperSlider = document.getElementById("upperSlider");
const sliderRange = document.createElement("div");

const minValOutput = document.getElementById("minVal");
const maxValOutput = document.getElementById("maxVal");

function updateSlider() {
  const minVal = parseInt(lowerSlider.value);
  const maxVal = parseInt(upperSlider.value);
  let flag = false;
  if (minVal >= maxVal) {
    lowerSlider.value = maxVal;
    flag = true;
  }

  sliderRange.style.left = `${minVal}%`;
  sliderRange.style.width = `${maxVal - minVal}%`;
  minValOutput.textContent = flag ? maxVal : minVal;
  maxValOutput.textContent = maxVal;
}

lowerSlider.addEventListener("input", updateSlider);
upperSlider.addEventListener("input", updateSlider);
//end slider
