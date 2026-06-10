import { duaService } from '../services/dua.service.js';
import { catchAsync } from '../utils/errors.js';

export const duaController = {
  send: catchAsync(async (req, res) => {
    res.status(201).json(await duaService.send(req.params.username, req.body));
  }),
  inbox: catchAsync(async (req, res) => {
    res.json(await duaService.inbox(req.user.id, req.query));
  }),
  markRead: catchAsync(async (req, res) => {
    res.json(await duaService.markRead(req.user.id, req.params.id));
  }),
  deleteOwn: catchAsync(async (req, res) => {
    res.json(await duaService.deleteOwn(req.user.id, req.params.id));
  }),
  report: catchAsync(async (req, res) => {
    res.status(201).json(await duaService.report(req.params.id, req.body, req.user?.id));
  })
};
