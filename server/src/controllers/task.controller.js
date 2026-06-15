const taskService = require('../services/task.service');
const { successResponse, paginate } = require('../utils/helpers');

const taskController = {
  async create(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          code: 400,
          message: '请上传视频文件',
          error: { type: 'INVALID_PARAMS', detail: '视频文件为必填项' },
        });
      }

      let region = null;
      if (req.body.region) {
        try {
          region = typeof req.body.region === 'string'
            ? JSON.parse(req.body.region)
            : req.body.region;
        } catch {
          return res.status(400).json({
            code: 400,
            message: '处理区域格式错误',
            error: { type: 'INVALID_PARAMS', detail: 'region 需为有效的 JSON 对象' },
          });
        }
      }

      const result = await taskService.createTask(
        req.user.id,
        req.body.task_type,
        req.file,
        region
      );
      res.status(201).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const query = req.query;
      const { page, pageSize, offset } = paginate(query.page, query.page_size);
      const result = await taskService.getTaskList(req.user.id, {
        page,
        pageSize,
        offset,
        status: query.status,
        task_type: query.task_type,
      });
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async detail(req, res, next) {
    try {
      const result = await taskService.getTaskDetail(req.params.id, req.user.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async progress(req, res, next) {
    try {
      const result = await taskService.getTaskProgress(req.params.id, req.user.id);
      if (!result) {
        return res.status(404).json({
          code: 404,
          message: '任务不存在',
        });
      }
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async retry(req, res, next) {
    try {
      const result = await taskService.retryTask(req.params.id, req.user.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async cancel(req, res, next) {
    try {
      const result = await taskService.cancelTask(req.params.id, req.user.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await taskService.deleteTask(req.params.id, req.user.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async download(req, res, next) {
    try {
      const result = await taskService.getDownloadUrl(req.params.id, req.user.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = taskController;
