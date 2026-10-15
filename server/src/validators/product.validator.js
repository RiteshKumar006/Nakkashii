import { z } from "zod";

const optionSchema = z.object({
    name: z.string().trim().min(1),
    value: z.string().trim().min(1),
});

export const variantSchema = z.object({
    sku: z.string().trim().min(1).max(40),
    options: z.array(optionSchema).default([]),
    price: z.number().min(0),
    stock: z.number().int().min(0).default(0),
    isAvailable: z.boolean().default(true),
});

export const createProductSchema = z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(2000),
    category: z.string().trim().min(1).max(60),
    attributes: z.array(z.string().trim().min(1)).max(3).default([])
        .refine((list) => new Set(list.map((a) => a.toLowerCase())).size === list.length, "Attributes must be unique"),
    variants: z.array(variantSchema).min(1, "Add at least one variant"),
});

// attributes can't change after create, it would break the existing variants
export const updateProductSchema = createProductSchema
    .pick({ name: true, description: true, category: true })
    .partial()
    .strict();

// stock is not editable here, use the stock endpoint so updates stay atomic
export const updateVariantSchema = variantSchema
    .pick({ sku: true, options: true, price: true, isAvailable: true })
    .partial()
    .strict();

export const stockSchema = z.object({
    change: z.number().int().refine((n) => n !== 0, "Change can't be 0"),
});

export const purchaseSchema = z.object({
    quantity: z.number().int().min(1).max(20).default(1),
});
