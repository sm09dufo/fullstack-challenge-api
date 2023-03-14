import express from 'express';
import controller from '../controllers/posts';
const router = express.Router();

router.get('/game/:id', controller.getGame);
export = router;