// year
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const yearElement = document.getElementById("current-year");
yearElement.textContent = currentYear;
//end year

//plus minus
document.addEventListener("DOMContentLoaded", function () {
  const quantitySpans = document.querySelectorAll(".quantity");
const btnPluses = document.querySelectorAll(".btn-plus");
const btnMinuses = document.querySelectorAll(".btn-minus");

btnPluses.forEach(function(btnPlus, index) {
  btnPlus.addEventListener("click", function () {
    let quantity = parseInt(quantitySpans[index].textContent);
    quantity++;
    quantitySpans[index].textContent = quantity;
    const productId = btnPlus.getAttribute("data-product-id");
    updateCart(productId, "add");
  });
});

btnMinuses.forEach(function(btnMinus, index) {
  btnMinus.addEventListener("click", function () {
    let quantity = parseInt(quantitySpans[index].textContent);
    if (quantity > 0) {
      quantity--;
      quantitySpans[index].textContent = quantity;
    }
    const productId = btnMinus.getAttribute("data-product-id");
    updateCart(productId, "remove");
  });
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
