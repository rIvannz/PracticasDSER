const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  exposedHeaders: ['ETag', 'Last-Modified']
};

app.use(cors(corsOptions));
app.use(express.json()); 


app.get('/data', (req, res) => {
  const data = { message: "Hola, este es la información en tu Caché :(" };

  const etag = `"${Buffer.from(JSON.stringify(data)).toString('base64')}"`;
  console.log(`etag /data ${etag}`);

  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  res.setHeader('ETag', etag);
  return res.json(data);
});


//  PRODUCTO: GET + PUT usando ETag

let productLastModified = new Date();
productLastModified.setMilliseconds(0);

let productData = {
  id: 101,
  name: "Salchipapa",
  price: 80.00,
  message: "¡La mejor salchipapa del mundo! ..."
};

function buildEtag(obj) {

  return `"${Buffer.from(JSON.stringify(obj)).toString('base64')}"`;
}

app.get('/product', (req, res) => {
  const etag = buildEtag(productData);
  console.log(`etag /product ${etag}`);

  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch && ifNoneMatch === etag) {
    return res.status(304).end();
  }

 
  res.setHeader('Last-Modified', productLastModified.toUTCString());

  res.setHeader('ETag', etag);
  return res.json(productData);
});

/**
 * PUT /product
 * Requiere If-Match: <etag actual>
 * Si no coincide -> 412 Precondition Failed
 */
app.put('/product', (req, res) => {
  const currentEtag = buildEtag(productData);
  const ifMatch = req.headers['if-match'];

  if (!ifMatch) {
    return res.status(428).json({
      error: "Falta el header If-Match. Debes enviar el ETag para actualizar (precondición)."
    });
  }

  if (ifMatch !== currentEtag) {
    return res.status(412).json({
      error: "ETag no coincide. El recurso cambió en el servidor. Haz GET /product y reintenta."
    });
  }

  const { name, price, message } = req.body || {};

  // Validación mínima (ajústala a tu gusto)
  if (typeof name !== 'string' || typeof message !== 'string' || typeof price !== 'number') {
    return res.status(400).json({
      error: "Body inválido. Esperado: { name: string, price: number, message: string }"
    });
  }

  productData = {
    ...productData,
    name,
    price,
    message
  };

  productLastModified = new Date();
  productLastModified.setMilliseconds(0);

  const newEtag = buildEtag(productData);

  res.setHeader('ETag', newEtag);
  res.setHeader('Last-Modified', productLastModified.toUTCString());

  return res.status(200).json({
    message: "Producto actualizado correctamente (PUT).",
    product: productData
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});