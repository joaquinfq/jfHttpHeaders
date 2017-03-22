const assert        = require('assert');
const jfHttpHeaders = require('./index');
//------------------------------------------------------------------------------
// Inicio de las pruebas
//------------------------------------------------------------------------------
let httpHeaders = new jfHttpHeaders(
    {
        'content-length' : 200,
        'JF-cms-VERSION' : '0.1',
        'X-Req-With'     : 'jfAjax'
    },
    {
        jf           : 'jf',
        cms          : 'CMS',
        'X-Req-With' : 'X-Requested-With'
    }
);
let headers     = httpHeaders.headers;
// Verificamos que se hayan convertido en Camel-Case los encabezados y se
// haya respetado el mapa.
assert.equal(headers['Content-Length'], 200);
assert.equal(headers['jf-CMS-Version'], '0.1');
assert.equal(headers['X-Requested-With'], 'jfAjax');
// Verificamos que recupere los encabezados sin importar may/min.
assert.equal(httpHeaders.get('CoNtEnT-lEnGtH'), 200);
assert.equal(httpHeaders.get('JF-CMS-VERSION'), '0.1');
assert.equal(httpHeaders.get('X-Req-With'), 'jfAjax');
assert.equal(httpHeaders.get('X-Requested-With'), 'jfAjax');
//------------------------------------------------------------------------------
// Comprobamos la conversión a texto
//------------------------------------------------------------------------------
headers     = `
Content-Length: 26012
Content-Range: bytes 21010-47021/47022
Content-Type: image/gif
Date: Wed, 15 Nov 1995 06:25:24 GMT
Last-Modified: Wed, 15 Nov 1995 04:58:08 GMT
`.trim().split('\n').join('\r\n');
httpHeaders = new jfHttpHeaders();
httpHeaders.parse(headers.split('\r\n'));
assert.equal(httpHeaders.toString(), headers);
// Comprobamos la eliminación del encabezado
httpHeaders.del('dAtE');
assert.equal(httpHeaders.get('Date'), undefined);
//------------------------------------------------------------------------------
// Verificamos los encabezados multílinea
//------------------------------------------------------------------------------
headers     = `
Content-Length: 26012
Content-Range: bytes 
 21010-47021/47022
Content-Type: image/gif
Date: Wed, 15 Nov 1995 
     06:25:24 GMT
Last-Modified: Wed, 15 Nov 1995 04:58:08 GMT
`.trim().split('\n').join('\r\n');
httpHeaders = new jfHttpHeaders();
httpHeaders.parse(headers.split('\r\n'));
assert.equal(httpHeaders.get('Content-Range'), 'bytes 21010-47021/47022');
assert.equal(httpHeaders.get('Date'), 'Wed, 15 Nov 1995 06:25:24 GMT');
//------------------------------------------------------------------------------
// Verificamos que se analice la línea de estado.
//------------------------------------------------------------------------------
headers     = 'HTTP/1.0 206 Partial Content';
httpHeaders = new jfHttpHeaders();
httpHeaders.parse(headers.split('\r\n'));
assert.deepEqual(
    httpHeaders.status,
    {
        code    : '206',
        text    : 'Partial Content',
        version : {
            major : '1',
            minor : '0'
        }
    }
);
//------------------------------------------------------------------------------
// Verificamos las cabeceras duplicadas
//------------------------------------------------------------------------------
httpHeaders = new jfHttpHeaders();
httpHeaders.parse(
    `
Content-Length: 26012
Content-Type: image/gif
Set-Cookie: micookie1=1234
X-Requested-With: jfAjax
Content-Length: 123456
Content-Type: application/json
Set-Cookie: micookie2=9876
X-Requested-With: XMLHTTPRequest
`.split('\n')
);
// Tipo: first, permanece el primer valor
assert.equal(httpHeaders.get('Content-Length'), '26012');
assert.equal(httpHeaders.get('Content-Type'), 'image/gif');
// Tipo: array, se concantenan con \n
assert.equal(httpHeaders.get('Set-Cookie'), 'micookie1=1234\nmicookie2=9876');
// Tipo: el resto, se concantenan con ', '
assert.equal(httpHeaders.get('x-requested-with'), 'jfAjax, XMLHTTPRequest');
