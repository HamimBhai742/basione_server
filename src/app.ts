import express, { Application } from "express";
const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("basione server is running............");
});

export default app;
