const Product = require("../models/product");
const image = require("../utils/image");

async function addProduct(req, res) {
  const {
    brand,
    model,
    description,
    price,
    stock,
    categoryId,
    subCategoryId,
    highlighted,
    discount_percentaje,
    sold,
    active,
  } = req.body;

  const newProduct = new Product({
    brand,
    model,
    description,
    price,
    stock,
    sold,
    categoryId,
    subCategoryId,
    highlighted,
    discount_percentaje,
    sold,
    active,
  });

  // Cover
  if (req.files.cover) {
    const imagePath = image.getFileName(req.files.cover);
    newProduct.cover = imagePath;
  }

  // Carrousel
  if (req.files.images) {
    const files = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];
    newProduct.images = files.map((f) => image.getFileName(f));
  }
  try {
    await newProduct.save();
    res.status(200).send({ msg: `Producto agregado` });
  } catch (error) {
    res.status(500).send({ msg: `Error al agregar el producto: ${error}` });
  }
}

async function getProducts(req, res) {
  try {
    const products = await Product.find();
    if (!products.length) {
      return res.status(404).send({ msg: `No se encontraron productos` });
    }
    res.status(200).send(products);
  } catch (error) {
    res
      .status(500)
      .send({ msg: `Error al obtener los productos...`, error: error.message });
  }
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const productData = req.body;

  if (req.files.cover) {
    const imagePath = image.getFileName(req.files.cover);
    productData.cover = imagePath;
  }

  if (req.files.images) {
    const files = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];
    productData.images = files.map((f) => image.getFileName(f));
  }

  try {
    await Product.findByIdAndUpdate({ _id: id }, productData);
    res.status(200).send({ msg: `Producto actualizado correctamente.` });
  } catch (error) {
    res
      .status(400)
      .send({ msg: `Error al actualizar el producto solicitado.` });
  }
}

async function deleteProduct(req, res) {
  const { id } = req.params;

  try {
    await Product.findByIdAndDelete(id);
    res.status(200).send({ msg: `Producto eliminado` });
  } catch (error) {
    res.status(400).send({ msg: `Error al intentar eliminar el producto` });
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).send({ msg: "Producto no encontrado" });
    }

    // Si tenés "active" y querés ocultar inactivos:
    if (product.active === false) {
      return res.status(404).send({ msg: "Producto no disponible" });
    }

    return res.status(200).send({ product });
  } catch (error) {
    return res.status(500).send({ msg: "Error obteniendo producto" });
  }
}

module.exports = {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getProductById,
};
