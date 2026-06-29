export type Product = {
  id: string
  name: string
  barcode: string
  price: number
  isCombo?: boolean
  category?: string
}

export const PRODUCTS: Product[] = [
  { id: "1",  name: "Aceite Girasol 900ml",        barcode: "7790000000002",   price: 1800.00 },
  { id: "2",  name: "Agua Mineral 2L",              barcode: "7790000000004",   price: 800.00  },
  { id: "3",  name: "Arroz Largo Fino 1kg",         barcode: "7790000000001",   price: 1200.00 },
  { id: "4",  name: "Coca-Cola 500ml",              barcode: "7790895000997",   price: 123.00  },
  { id: "5",  name: "Coca-Cola lata",               barcode: "7790895000232",   price: 123.00  },
  { id: "6",  name: "Coca-Cola Orig. 500ml",        barcode: "7790895000782",   price: 123.00  },
  { id: "7",  name: "Detergente 500ml",             barcode: "7790000000005",   price: 950.00  },
  { id: "8",  name: "Fideos Spaghetti 500g",        barcode: "7790000000009",   price: 700.00  },
  { id: "9",  name: "Galletitas Dulces 200g",       barcode: "7790000000010",   price: 600.00  },
  { id: "10", name: "Gaseosa Cola 1.5L",            barcode: "7790000000003",   price: 1500.00 },
  { id: "11", name: "Jabón Tocador x4",             barcode: "7790000000008",   price: 1200.00 },
  { id: "12", name: "Leche Entera 1L",              barcode: "7790000000006",   price: 1100.00 },
  { id: "13", name: "Sprite 600ml",                 barcode: "7501055305629",   price: 123.00  },
  { id: "14", name: "Sprite Zero",                  barcode: "7790895064173",   price: 123.00  },
  { id: "15", name: "Yogur Frutilla 200g",          barcode: "7790000000007",   price: 650.00  },
  { id: "16", name: "Combo CIO",                    barcode: "CIO",             price: 213.00,  isCombo: true },
  { id: "17", name: "Combo SAD",                    barcode: "SAD",             price: 2213.00, isCombo: true },
]

export function formatPrice(price: number): string {
  return price.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
