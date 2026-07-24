import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cinemaRouter from "./cinema";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cinemaRouter);

export default router;
