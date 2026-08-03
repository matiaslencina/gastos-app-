export const CATEGORIAS = [
  "Comida",
  "Transporte",
  "Vivienda",
  "Servicios",
  "Salud",
  "Entretenimiento",
  "Ropa",
  "Mascotas",
  "Otros",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];
