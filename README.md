# jfHttpHeaders [![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Class for manipulating HTTP headers.

## Usage

[![npm install jfHttpHeaders](https://nodei.co/npm/jf-http-headers.png?compact=true)](https://npmjs.org/package/jf-http-headers/)

### Using response headers object (as in http.IncomingMessage, http.ServerResponse, etc.)

```js
const jfHttpHeaders = require('jf-http-headers');
const httpHeaders   = new jfHttpHeaders(message.headers);
console.log(httpHeaders.get('Content-Type')); // application/json
console.log(httpHeaders.get('Host'));         // http://localhost:3333
```

### Using raw response headers as string

```js
/**
 * Server response is:
HTTP/1.0 206 Partial Content
Content-Length: 26012
Content-Range: bytes 21010-47021/47022
Content-Type: image/gif
Date: Wed, 15 Feb 2017 06:25:24 GMT
Last-Modified: Wed, 15 Feb 2017 04:58:08 GMT
 */
const jfHttpHeaders = require('jf-http-headers');
const httpHeaders   = new jfHttpHeaders();
httpHeaders.parse(response.headers.split('\r\n'));
console.log(httpHeaders.get('Content-Range')); // bytes 21010-47021/47022
console.log(httpHeaders.get('Date'));          // Wed, 15 Feb 2017 06:25:24 GMT
console.log(httpHeaders.status); // { code : '206', text : 'Partial Content', version : { major : '1', minor : '0' } }
```

### Building headers and sending request using differents libraries

`XMLHttpRequest` must be open before set headers, 
`http.request` needs headers as option, etc. So, each library use a different approach.


Using `jfHttpHeaders` you can split your logic in 2 parts:
* Building body using a lib and setting headers using jfHttpHeaders and return 
  an instance of `jfHttpHeaders` as configuration ready for another lib.
* Sending request using another lib. Before call send, you can set headers
  iterating over jfHttpHeaders instance using for..of loop.

Using jfHttpHeaders as mediator can simplify your logic.

```js
const jfHttpHeaders = require('jf-http-headers');
const httpHeaders   = new jfHttpHeaders();
// Preparing body before sending request.
body = {...};
httpHeaders.set('Content-Type', 'application/json');
httpHeaders.set('X-Requested-With', 'jfAjax');
//...
//...
//...
// Now, send the request using an instance of XMLHttpRequest
// jfHttpHeaders is iterable, so you can use for..of loop.
for (let header of httpHeaders)
{
    xhr.setRequestHeader(header, httpHeaders.get(header));
}
xhr.send(body);

// Or you can use node too
require('http').request(
    {
        ...
        headers : httpHeaders.headers
        ...
    },
    ...
)
```

Or you can extend `jfHttpHeaders` and to add other methods for pass an instance of 
your class bewteen your libraries.

### More examples

You can view in `test.js` some examples more about use `jfHttpHeaders`.
