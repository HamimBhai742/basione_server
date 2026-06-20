import z from "zod";

export const contactSubmitSchema = z.object({
  name: z.string({ message: "Naam is verplicht" }).min(1, "Naam is verplicht"),
  email: z.string({ message: "E-mailadres is verplicht" }).email("Voer een geldig e-mailadres in"),
  phone: z.string().optional(),
  subject: z.string({ message: "Onderwerp is verplicht" }).min(1, "Onderwerp is verplicht"),
  message: z.string({ message: "Bericht is verplicht" }).min(1, "Bericht is verplicht"),
});
