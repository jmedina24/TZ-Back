const categories = [
  {
    id: "notebooks-pc",
    nombre: "Notebooks y PC",
    slug: "notebooks-pc",
    icono: "bi-laptop",
    subcategorias: [
      { id: "gaming", nombre: "Gaming", slug: "gaming" },
      { id: "ultrabooks", nombre: "Ultrabooks", slug: "ultrabooks" },
      { id: "2-en-1", nombre: "2 en 1", slug: "2-en-1" },
      { id: "all-in-one", nombre: "All-in-One", slug: "all-in-one" },
      { id: "escritorio", nombre: "Escritorio", slug: "escritorio" }
    ]
  },
  {
    id: "componentes-pc",
    nombre: "Componentes de PC",
    slug: "componentes-pc",
    icono: "bi-cpu",
    subcategorias: [
      { id: "procesadores", nombre: "Procesadores", slug: "procesadores" },
      { id: "placas-video", nombre: "Placas de video", slug: "placas-video" },
      { id: "placas-madre", nombre: "Placas madre", slug: "placas-madre" },
      { id: "ram", nombre: "Memorias RAM", slug: "ram" },
      { id: "almacenamiento", nombre: "Almacenamiento", slug: "almacenamiento" },
      { id: "fuentes", nombre: "Fuentes", slug: "fuentes" },
      { id: "refrigeracion", nombre: "Refrigeración", slug: "refrigeracion" }
    ]
  },
  {
    id: "perifericos",
    nombre: "Periféricos",
    slug: "perifericos",
    icono: "bi-keyboard",
    subcategorias: [
      { id: "teclados", nombre: "Teclados", slug: "teclados" },
      { id: "mouse", nombre: "Mouse", slug: "mouse" },
      { id: "auriculares", nombre: "Auriculares", slug: "auriculares" },
      { id: "parlantes", nombre: "Parlantes", slug: "parlantes" },
      { id: "webcams", nombre: "Webcams", slug: "webcams" }
    ]
  },
  {
    id: "monitores",
    nombre: "Monitores y Pantallas",
    slug: "monitores",
    icono: "bi-display",
    subcategorias: [
      { id: "gaming-monitores", nombre: "Gaming", slug: "gaming-monitores" },
      { id: "profesionales", nombre: "Profesionales", slug: "profesionales" },
      { id: "smart-tv", nombre: "Smart TV", slug: "smart-tv" }
    ]
  },
  {
    id: "celulares-tablets",
    nombre: "Celulares y Tablets",
    slug: "celulares-tablets",
    icono: "bi-phone",
    subcategorias: [
      { id: "smartphones", nombre: "Smartphones", slug: "smartphones" },
      { id: "tablets", nombre: "Tablets", slug: "tablets" },
      { id: "accesorios-moviles", nombre: "Accesorios", slug: "accesorios-moviles" }
    ]
  },
  {
    id: "gaming",
    nombre: "Consolas y Gaming",
    slug: "gaming",
    icono: "bi-controller",
    subcategorias: [
      { id: "consolas", nombre: "Consolas", slug: "consolas" },
      { id: "juegos", nombre: "Juegos", slug: "juegos" },
      { id: "accesorios-gaming", nombre: "Accesorios", slug: "accesorios-gaming" }
    ]
  },
  {
    id: "redes",
    nombre: "Redes y Conectividad",
    slug: "redes",
    icono: "bi-wifi",
    subcategorias: [
      { id: "routers", nombre: "Routers", slug: "routers" },
      { id: "repetidores", nombre: "Repetidores", slug: "repetidores" },
      { id: "adaptadores", nombre: "Adaptadores", slug: "adaptadores" },
      { id: "switches", nombre: "Switches", slug: "switches" }
    ]
  },
  {
    id: "impresion-oficina",
    nombre: "Impresión y Oficina",
    slug: "impresion-oficina",
    icono: "bi-printer",
    subcategorias: [
      { id: "impresoras", nombre: "Impresoras", slug: "impresoras" },
      { id: "cartuchos", nombre: "Cartuchos", slug: "cartuchos" },
      { id: "escaneres", nombre: "Escáneres", slug: "escaneres" }
    ]
  },
  {
    id: "smart-home",
    nombre: "Smart Home",
    slug: "smart-home",
    icono: "bi-house",
    subcategorias: [
      { id: "asistentes", nombre: "Asistentes", slug: "asistentes" },
      { id: "domotica", nombre: "Domótica", slug: "domotica" }
    ]
  },
];

module.exports = { categories };
