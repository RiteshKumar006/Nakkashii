import { ValidationError } from "../utils/error.js";

export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return next(new ValidationError("Invalid input", details));
    }

    if (source === "body") {
      req.body = result.data;
    } else {
      req.validated = { ...req.validated, [source]: result.data };
    }
    next();
  };
}
