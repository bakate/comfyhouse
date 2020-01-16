const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "hnyn9gk86ijf",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "-CcEymSqoIz4rNWpaZYiEcBOtWSjTOqg4EQGiydDpoM"
});

window.$ = document.querySelector.bind(document);
window.$$ = document.querySelectorAll.bind(document);
const cartBtn = $(".cart-btn");
const closeCartBtn = $(".close-cart");
const clearCartBtn = $(".clear-cart");
const cartDOM = $(".cart");
const cartOverlay = $(".cart-overlay");
const cartItems = $(".cart-items");
const cartTotal = $(".cart-total");
const cartContent = $(".cart-content");
const productsDOM = $(".products-center");

//cart
let cart = [];

//buttons
let buttonsDom = [];
//getting the products

class Products {
  async getProducts() {
    try {
      // This API call will request an entry with the specified ID from the space defined at the top, using a space-specific access token.
      let contentful = await client.getEntries({
        content_type: "comfyHouseProduct"
      });

      // let result = await fetch("products.json");
      // let data = await result.json();
      let products = contentful.items;
      products = products.map(item => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return { title, price, id, image };
      });
      return products;
    } catch (e) {
      console.log(e);
    }
  }
}

//display products
class UI {
  displayProducts(products) {
    let result = "";
    products.forEach(product => {
      result += `
       <!--Single product-->
          <article class="product">
            <div class="img-container">
              <img
                src=${product.image}
                alt="product"
                class="product-img"
              />
              <button class="bag-btn" data-id=${product.id}>
                <i class="fas fa-shopping-cart"></i>
                ajouter au panier
              </button>
            </div>
            <h3>${product.title}</h3>
            <h4>${product.price}€</h4>
          </article>

      `;
    });
    productsDOM.innerHTML = result;
  }
  getBagButtons() {
    const buttons = [...$$(".bag-btn")];
    buttonsDom = buttons;
    buttons.forEach(button => {
      let id = button.dataset.id;
      let inCart = cart.find(item => item.id === id);
      if (inCart) {
        button.innerText = "Déjà ajouté";
        button.disabled;
      }
      button.addEventListener("click", e => {
        e.target.innerText = "Déjà ajouté";
        e.target.disabled;
        //get product from products
        let cartItem = { ...Storage.getProduct(id), amount: 1 };
        // add product to the card
        cart = [...cart, cartItem];

        //save cart in local storage
        Storage.saveCart(cart);
        //save cart values
        this.setCartValues(cart);
        // display cart items
        this.addCartItem(cartItem);
        //show the cart
        this.showCart(cartItem);
      });
    });
  }

  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.map(item => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
  }
  addCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
    <img src=${item.image} alt="product" />
            <div>
              <h4>${item.title}</h4>
              <h5>${item.price}€</h5>
              <span class="remove-item" data-id=${item.id} >supprimer</span>
            </div>
            <div>
              <i class="fas fa-chevron-up" data-id=${item.id}></i>
              <p class="item-amount">${item.amount}</p>
              <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div>
    `;
    cartContent.appendChild(div);
  }
  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cartDOM.classList.add("showCart");
  }
  setupAPP() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populate(cart);
    cartBtn.addEventListener("click", this.showCart);
    closeCartBtn.addEventListener("click", this.hideCart);
  }
  populate(cart) {
    cart.forEach(item => this.addCartItem(item));
  }
  hideCart() {
    cartOverlay.classList.remove("transparentBcg");
    cartDOM.classList.remove("showCart");
  }
  cartLogic() {
    //clear cart button
    clearCartBtn.addEventListener("click", () => {
      this.clearCart();
    });
    //cart functionality
    cartContent.addEventListener("click", e => {
      const el = e.target.classList;
      if (el.contains("remove-item")) {
        let removeItem = e.target;
        let id = removeItem.dataset.id;
        cartContent.removeChild(removeItem.closest(".cart-item"));
        this.removeItem(id);
      } else if (el.contains("fa-chevron-up")) {
        let addAmount = e.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount += 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if (el.contains("fa-chevron-down")) {
        let lowerAmount = e.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount -= 1;
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          lowerAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(lowerAmount.closest(".cart-item"));
          this.removeItem(id);
        }
      }
    });
  }
  clearCart() {
    let cartItems = cart.map(item => item.id);
    cartItems.forEach(id => this.removeItem(id));
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }
  removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>ajouter au panier`;
  }
  getSingleButton(id) {
    return buttonsDom.find(button => button.dataset.id === id);
  }
}

//localStorage

class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }
  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find(product => product.id === id);
  }
  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  static getCart() {
    const items = localStorage.getItem("cart");
    return items ? JSON.parse(items) : [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const products = new Products();
  //setup App
  ui.setupAPP();
  //get all products
  products
    .getProducts()
    .then(products => {
      ui.displayProducts(products);
      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagButtons();
      ui.cartLogic();
    });
});
