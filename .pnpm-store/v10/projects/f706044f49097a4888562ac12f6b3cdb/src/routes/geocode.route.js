import express from "express";
import { reverseGeocodeController } from "../modules/geocode/geocode.controller.js";

export const geocodeRoutes = express.Router();

geocodeRoutes.get("/reverse", reverseGeocodeController);
