import Client from "../models/Client.js";

export const createClient = async (req, res) => {
  try {
    const client = await Client.create({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: "Client created successfully",
      client
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getClients = async (req, res) => {
  try {
    const clients = await Client.find()
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};