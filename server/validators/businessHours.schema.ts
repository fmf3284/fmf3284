import { z } from 'zod';

/**
 * Schema for a single day's business hours
 */
export const businessHoursDaySchema = z.object({
  dayOfWeek: z.coerce.number().min(0).max(6),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM'),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM'),
  isClosed: z.boolean().optional(),
});

/**
 * Schema for setting full week business hours
 */
export const setBusinessHoursSchema = z.object({
  locationId: z.string().min(1),
  hours: z.array(businessHoursDaySchema),
});

export type BusinessHoursDayInput = z.infer<typeof businessHoursDaySchema>;
export type SetBusinessHoursInput = z.infer<typeof setBusinessHoursSchema>;
