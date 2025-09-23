const mongoose = require("mongoose");
const Product = require("../models/product"); // ruta a tu modelo
require("dotenv").config();

const categories = [
  { id: "notebooks-pc", sub: ["gaming", "ultrabooks", "2-en-1", "all-in-one", "escritorio"] },
  { id: "celulares-tablets", sub: ["smartphones", "tablets"] },
  { id: "perifericos", sub: ["teclados", "mouses", "auriculares"] },
];

const brands = ["Apple", "Dell", "Samsung", "Logitech", "HP", "Asus", "Lenovo"];
const models = ["X", "Pro", "Max", "Ultra", "Air", "Gamer", "Plus", "Series"];
const descriptions = [
  "Producto de alta calidad para uso diario.",
  "Ideal para gaming y trabajo profesional.",
  "Diseñado para máxima portabilidad y rendimiento.",
  "Perfecto para estudio y oficina.",
  "Alta duración de batería y rendimiento excepcional."
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Genera URL de imagen aleatoria pública
const randomImage = () => `https://picsum.photos/400/300?random=${randomInt(1, 500)}`;

const generateProducts = (count = 100) => {
  const products = [];

  for (let i = 0; i < count; i++) {
    const brand = brands[randomInt(0, brands.length - 1)];
    const model = `${brand} ${models[randomInt(0, models.length - 1)]} ${randomInt(100, 999)}`;
    const description = descriptions[randomInt(0, descriptions.length - 1)];
    const price = randomInt(50, 2000);
    const stock = randomInt(5, 50);
    const sold = randomInt(0, 100);
    const highlighted = Math.random() < 0.3;
    const discount_percentaje = Math.random() < 0.3 ? randomInt(5, 30) : 0;

    const catIndex = randomInt(0, categories.length - 1);
    const categoryId = categories[catIndex].id;
    const subCategoryId = categories[catIndex].sub[randomInt(0, categories[catIndex].sub.length - 1)];

    const cover = randomImage();
    const images = [];
    const imgCount = randomInt(1, 4); // entre 1 y 4 imágenes
    for (let j = 0; j < imgCount; j++) {
      images.push(randomImage());
    }

    products.push({
      brand,
      model,
      description,
      price,
      stock,
      sold,
      highlighted,
      discount_percentaje,
      categoryId,
      subCategoryId,
      cover,
      images,
      active: true,
    });
  }

  return products;
};

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Conectado a MongoDB");
    await Product.deleteMany({}); // limpia la colección antes del seed
    const products = generateProducts(100);
    await Product.insertMany(products);
    console.log("¡Seed completado con 100 productos con imágenes públicas!");
    mongoose.disconnect();
  })
  .catch((err) => console.error(err));
