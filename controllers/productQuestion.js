const ProductQuestion = require("../models/productQuestion");
const Product = require("../models/product");

// Elegí los campos reales que tenga tu User
// (si tu User tiene "name", "lastname", "email" etc)
const USER_PUBLIC_FIELDS = "name lastname email username";

async function getQuestionsByProduct(req, res) {
  try {
    const { id } = req.params;

    const exists = await Product.findById(id).select("_id");
    if (!exists) return res.status(404).send({ msg: "Producto no encontrado." });

    const list = await ProductQuestion.find({ productId: id })
      .sort({ createdAt: -1 })
      .populate("userId", USER_PUBLIC_FIELDS)
      .populate("answeredBy", USER_PUBLIC_FIELDS)
      .lean();

    return res.status(200).send(list);
  } catch (e) {
    console.error(e);
    return res.status(500).send({ msg: "Error cargando preguntas." });
  }
}

async function addQuestion(req, res) {
  try {
    const { id: productId } = req.params;

    // ✅ acepta text o question
    const raw = req.body?.text ?? req.body?.question;
    const text = String(raw || "").trim();

    if (!text) {
      return res.status(400).send({ msg: "La pregunta es requerida." });
    }

    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).send({ msg: "No autorizado." });

    const created = await ProductQuestion.create({
      productId,
      userId,
      text,
      status: "pending",
    });

    const populated = await ProductQuestion.findById(created._id)
      .populate("userId", USER_PUBLIC_FIELDS)
      .populate("answeredBy", USER_PUBLIC_FIELDS)
      .lean();

    return res.status(201).send(populated);
  } catch (e) {
    console.error(e);
    return res.status(500).send({ msg: "Error creando pregunta." });
  }
}


async function answerQuestion(req, res) {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;

    if (!answer || !String(answer).trim()) {
      return res.status(400).send({ msg: "La respuesta es requerida." });
    }

    const adminId = req.user?.id || req.user?._id || null;

    const updated = await ProductQuestion.findByIdAndUpdate(
      questionId,
      {
        answer: String(answer).trim(),
        status: "answered",
        answeredBy: adminId,
        answeredAt: new Date(),
      },
      { new: true }
    )
      .populate("userId", USER_PUBLIC_FIELDS)
      .populate("answeredBy", USER_PUBLIC_FIELDS)
      .lean();

    if (!updated) return res.status(404).send({ msg: "Pregunta no encontrada." });

    return res.status(200).send(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).send({ msg: "Error respondiendo pregunta." });
  }
}

module.exports = {
  getQuestionsByProduct,
  addQuestion,
  answerQuestion,
};
