const express = require("express");
const Usuario = require("../models/Usuario");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");
require("dotenv").config();

// Obtener todos los usuarios
router.get("/", authMiddleware, async (req, res) => {
    const usuarios = await Usuario.find();
    res.json(usuarios);
});

// Registro
router.post("/register", async (req, res) => {
  try {
    const { nombre,email, password } = req.body;
    const existingUser = await Usuario.findOne({ email });

    if (existingUser) return res.status(400).json({ msg: "El usuario ya existe" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Usuario({ nombre, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ msg: "Usuario registrado" });
  } catch (error) {
    res.status(500).json({ msg: "Error en el servidor", error });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Usuario.findOne({ email });

    if (!user) return res.status(400).json({ msg: "Credenciales inválidas" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Credenciales inválidas" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ msg: "Error en el servidor" });
  }
});

module.exports = router;
