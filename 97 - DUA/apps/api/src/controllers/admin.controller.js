import { adminService } from '../services/admin.service.js';
import { catchAsync } from '../utils/errors.js';

export const adminController = {
  stats: catchAsync(async (req, res) => {
    res.json(await adminService.stats(req.query.chart));
  }),
  users: catchAsync(async (req, res) => {
    res.json(await adminService.users(req.query));
  }),
  user: catchAsync(async (req, res) => {
    res.json(await adminService.user(req.params.id));
  }),
  banUser: catchAsync(async (req, res) => {
    res.json(await adminService.banUser(req.params.id, req.body.reason));
  }),
  unbanUser: catchAsync(async (req, res) => {
    res.json(await adminService.unbanUser(req.params.id));
  }),
  deleteUser: catchAsync(async (req, res) => {
    res.json(await adminService.deleteUser(req.params.id));
  }),
  duas: catchAsync(async (req, res) => {
    res.json(await adminService.duas(req.query));
  }),
  hideDua: catchAsync(async (req, res) => {
    res.json(await adminService.setDuaHidden(req.params.id, true));
  }),
  unhideDua: catchAsync(async (req, res) => {
    res.json(await adminService.setDuaHidden(req.params.id, false));
  }),
  deleteDua: catchAsync(async (req, res) => {
    res.json(await adminService.deleteDua(req.params.id));
  }),
  reports: catchAsync(async (req, res) => {
    res.json(await adminService.reports(req.query));
  }),
  resolveReport: catchAsync(async (req, res) => {
    res.json(await adminService.resolveReport(req.params.id, req.body.hideDua));
  }),
  dismissReport: catchAsync(async (req, res) => {
    res.json(await adminService.dismissReport(req.params.id));
  })
};
