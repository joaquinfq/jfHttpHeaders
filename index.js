const headerLine = /^([^:]+)\s*:\s*(.+)\s*$/;
const statusLine = /^HTTP\/(\d+)\.(\d+)\s+(\d+)\s+(.+)$/;
/**
 * Encabezados con un tipo específico.
 *
 * * `array` : Puede tener múltiples valores.
 * * `first` : Su valor es único y si se encuentra más de uno, persiste el primero.
 *
 * Si el encabezado no se encuentra en esta variable, se asume que puede ser
 * especificado varias veces y se concatenarán con ',' los valores.
 *
 * @type {Object}
 *
 * @see https://dxr.mozilla.org/mozilla/source/netwerk/protocol/http/src/nsHttpHeaderArray.cpp
 */
const types      = {
    'authorization'       : 'first',
    'content-length'      : 'first',
    'content-type'        : 'first',
    'from'                : 'first',
    'host'                : 'first',
    'if-modified-since'   : 'first',
    'if-unmodified-since' : 'first',
    'location'            : 'first',
    'max-forwards'        : 'first',
    'proxy-authenticate'  : 'array',
    'proxy-authorization' : 'first',
    'referer'             : 'first',
    'set-cookie'          : 'array',
    'user-agent'          : 'first',
    'www-authenticate'    : 'array'
};
/**
 * Maneja encabezados HTTP.
 *
 * @namespace jf
 * @class     jf.HttpHeaders
 */
module.exports = class jfHttpHeaders {
    /**
     * Constructor de la clase
     *
     * @method constructor
     *
     * @param {Object?} headers Encabezados a usar para inicializar la clase.
     * @param {Object?} map     Mapa a usar para realizar la conversión de una cabecera
     *                          cuando no se quiera usar el formateo por defecto.
     *
     * @constructor
     */
    constructor(headers = {}, map = {})
    {
        /**
         * Encabezados manejados por la clase.
         *
         * @property headers
         * @type     {Object}
         */
        this.headers = {};
        /**
         * Mapa a usar para realizar la conversión de una cabecera cuando no
         * se quiera usar el formateo por defecto.
         *
         * @property map
         * @type     {Object}
         */
        this.map = Object.assign(
            {
                jf  : 'jf',
                www : 'WWW'
            },
            map
        );
        /**
         * Estado de una petición.
         * Se asigna usando el método `parseRawHeaders` si en el
         * texto pasado viene la primera línea de la respuesta HTTP.
         *
         * @type {Object}
         */
        this.status = {};
        //------------------------------------------------------------------------------
        this.set(headers);
    }

    /**
     * Iterador que permite usar un bucle for..of
     * para iterar sobre los encabezados.
     *
     * @return {Object}
     */
    [Symbol.iterator]()
    {
        let _current = 0;
        let _headers = Object.keys(this.headers).sort();
        return {
            next()
            {
                let _value = _headers[_current++];
                return {
                    done  : _value === undefined,
                    value : _value
                }
            }
        }
    }

    /**
     * Elimina un encabezado.
     *
     * @param {String} name Nombre del encabezado a eliminar.
     */
    del(name)
    {
        delete this.headers[this.constructor.format(name, this.map)];
    }

    /**
     * Devuelve el encabezado solicitado.
     *
     * @param {String} name Nombre del encabezado a devolver.
     *
     * @return {String|undefined}
     */
    get(name)
    {
        return this.headers[this.constructor.format(name, this.map)];
    }

    /**
     * Analiza un listado de encabezados.
     * Cada elemento de la lista es un texto con toda la línea del encabezado:
     *
     * ```
     * [
     *     'Content-Length: 200',
     *     'Content-Type: image/gif'
     * ]
     * ```
     *
     * @param {String[]} headers Encabezados a analizar.
     */
    parse(headers)
    {
        if (Array.isArray(headers))
        {
            let _lastHeader = '';
            headers.forEach(
                header =>
                {
                    if (header[0] === ' ' || header[0] === '\t')
                    {
                        if (_lastHeader)
                        {
                            this.set(
                                _lastHeader,
                                this.get(_lastHeader) + ' ' + header.trim(),
                                true
                            );
                        }
                    }
                    else
                    {
                        let _parts = header.match(headerLine);
                        if (_parts)
                        {
                            this.set(_lastHeader = _parts[1], _parts[2].trim());
                        }
                        else
                        {
                            _parts = header.match(statusLine);
                            if (_parts)
                            {
                                this.status = {
                                    code    : _parts[3],
                                    text    : _parts[4],
                                    version : {
                                        major : _parts[1],
                                        minor : _parts[2]
                                    }
                                };
                            }
                        }
                    }
                }
            );
        }
    }

    /**
     * Agrega un encabezado a la colección.
     *
     * @param {String|Object} header    Nombre del encabezado o mapa con los encabezados.
     * @param {String}        value     Valor del encabezado.
     * @param {Boolean}       overwrite Indica si se debe sobrescribir o seguir la recomendación del RFC2068.
     */
    set(header, value, overwrite = false)
    {
        if (header && typeof header === 'object')
        {
            for (let _header in header)
            {
                if (header.hasOwnProperty(_header))
                {
                    this.set(_header, header[_header], true);
                }
            }
        }
        else
        {
            const _formatted = this.constructor.format(header, this.map);
            const _headers   = this.headers;
            if (overwrite === true)
            {
                _headers[_formatted] = value;
            }
            else if (_formatted in _headers)
            {
                switch (types[header.toLowerCase()])
                {
                    case 'array':
                        _headers[_formatted] += '\n' + value;
                        break;
                    case 'first':
                        break;
                    default:
                        _headers[_formatted] += ', ' + value;
                        break
                }
            }
            else
            {
                _headers[_formatted] = value;
            }
        }
    }

    /**
     * @override
     */
    toString()
    {
        const _headers = [];
        for (let _header of this)
        {
            _headers.push(`${_header}: ${this.get(_header)}`);
        }
        return _headers.join('\r\n');
    }

    /**
     * Convierte un encabezado a formato Camel-Case para homogeneizar los encabezados.
     *
     * ```
     * content-length --> Content-Length
     * ```
     *
     * @param {String} name Nombre del encabezado a convertir.
     * @param {Object} map  Mapa a usar para realizar la conversión de una cabecera
     *                      cuando no se quiera usar el formateo por defecto.
     *
     * @return {String} Texto convertido.
     */
    static format(name, map = { jf : 'jf' })
    {
        if (name in map)
        {
            name = map[name];
        }
        else
        {
            name = name
                .split('-')
                .map(
                    part =>
                    {
                        const _part = part.toLowerCase();
                        return _part in map
                            ? map[_part]
                            : part[0].toUpperCase() + _part.substr(1);
                    }
                )
                .join('-');
        }
        return name;
    }
};
