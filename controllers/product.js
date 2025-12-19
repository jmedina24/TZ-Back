const mongoose = require("mongoose");
const Product = require("../models/product");
const image = require("../utils/image");


function escapeRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

// ============================
// OBTENER TODOS LOS PRODUCTOS
// ============================
async function getProducts(req, res) {
  try {
    const products = await Product.find();
    if (!products.length) {
      return res.status(404).send({ msg: "No se encontraron productos" });
    }
    return res.status(200).send(products);
  } catch (error) {
    return res.status(500).send({
      msg: "Error al obtener los productos...",
      error: error.message,
    });
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

// ============================
// BUSCADOR (LIVE SEARCH)
// ============================
async function searchProducts(req, res) {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit || "8", 10), 20);

    if (!q || q.length < 2) return res.status(200).send([]);

    const safe = escapeRegex(q);
    const rx = new RegExp(safe, "i");

    // ✅ 1) Regex (siempre funciona)
    let products = await Product.find({
      active: { $ne: false },
      $or: [{ brand: rx }, { model: rx }, { description: rx }],
    })
      .limit(limit)
      .select("brand model price stock cover categoryId subCategoryId active discount_percentaje")
      .lean();

    // ✅ 2) Si ya tenés text index, podés priorizar resultados por textScore
    // (opcional: si querés mantenerlo simple, borrá este bloque)
    if (!products.length) {
      try {
        const textProducts = await Product.find(
          { active: { $ne: false }, $text: { $search: q } },
          { score: { $meta: "textScore" } }
        )
          .sort({ score: { $meta: "textScore" } })
          .limit(limit)
          .select("brand model price stock cover categoryId subCategoryId active discount_percentaje")
          .lean();

        products = textProducts;
      } catch (_) {
        // si no hay índice text, Mongo puede tirar error: lo ignoramos
      }
    }

    return res.status(200).send(products);
  } catch (error) {
    return res.status(500).send({
      msg: "Error al buscar productos...",
      error: error.message,
    });
  }
}

// GET /api/v1/product/:idOrSlug
async function getOne(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ msg: "ID inválido" });
    }

    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).send({ msg: "Producto no encontrado" });

    return res.status(200).send(product);
  } catch (error) {
    return res.status(500).send({
      msg: "Error obteniendo producto",
      error: error.message,
    });
  }
}

module.exports = {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  searchProducts,
  getOne,
};
