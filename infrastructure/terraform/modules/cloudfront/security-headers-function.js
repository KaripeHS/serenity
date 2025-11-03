// CloudFront Function for Security Headers and Request Validation
function handler(event) {
    var request = event.request;
    var headers = request.headers;
    
    // Block requests with suspicious patterns
    var suspiciousPatterns = [
        /\.\.\//,           // Directory traversal
        /<script/i,         // Script injection
        /union.*select/i,   // SQL injection
        /exec\s*\(/i,      // Code execution
        /javascript:/i,     // JavaScript protocol
        /vbscript:/i       // VBScript protocol
    ];
    
    var uri = request.uri;
    var querystring = request.querystring;
    
    // Check URI for suspicious patterns
    for (var i = 0; i < suspiciousPatterns.length; i++) {
        if (suspiciousPatterns[i].test(uri)) {
            return {
                statusCode: 403,
                statusDescription: 'Forbidden',
                headers: {
                    'content-type': { value: 'text/plain' }
                },
                body: 'Access denied'
            };
        }
    }
    
    // Check query string for suspicious patterns
    for (var key in querystring) {
        var value = querystring[key].value;
        for (var j = 0; j < suspiciousPatterns.length; j++) {
            if (suspiciousPatterns[j].test(value)) {
                return {
                    statusCode: 403,
                    statusDescription: 'Forbidden',
                    headers: {
                        'content-type': { value: 'text/plain' }
                    },
                    body: 'Access denied'
                };
            }
        }
    }
    
    // Add security headers to request
    headers['x-forwarded-proto'] = { value: 'https' };
    headers['x-requested-with'] = { value: 'CloudFront' };
    
    // Rate limiting based on IP (basic implementation)
    var clientIp = event.viewer.ip;
    var currentTime = Math.floor(Date.now() / 1000);
    
    // Add timestamp header for rate limiting tracking
    headers['x-request-time'] = { value: currentTime.toString() };
    headers['x-client-ip'] = { value: clientIp };
    
    // Validate HTTP method
    var allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    if (allowedMethods.indexOf(request.method) === -1) {
        return {
            statusCode: 405,
            statusDescription: 'Method Not Allowed',
            headers: {
                'content-type': { value: 'text/plain' },
                'allow': { value: allowedMethods.join(', ') }
            },
            body: 'Method not allowed'
        };
    }
    
    // Block requests with overly long URIs or headers
    if (uri.length > 2048) {
        return {
            statusCode: 414,
            statusDescription: 'URI Too Long',
            headers: {
                'content-type': { value: 'text/plain' }
            },
            body: 'URI too long'
        };
    }
    
    // Check for excessively large headers
    for (var headerName in headers) {
        var headerValue = headers[headerName].value;
        if (headerValue && headerValue.length > 8192) {
            return {
                statusCode: 431,
                statusDescription: 'Request Header Fields Too Large',
                headers: {
                    'content-type': { value: 'text/plain' }
                },
                body: 'Request header too large'
            };
        }
    }
    
    // Normalize paths
    request.uri = uri.replace(/\/+/g, '/'); // Remove double slashes
    
    // Add CORS headers for preflight requests
    if (request.method === 'OPTIONS') {
        return {
            statusCode: 200,
            statusDescription: 'OK',
            headers: {
                'access-control-allow-origin': { value: '*' },
                'access-control-allow-methods': { value: 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS' },
                'access-control-allow-headers': { value: 'Content-Type, Authorization, X-Requested-With' },
                'access-control-max-age': { value: '86400' },
                'content-length': { value: '0' }
            }
        };
    }
    
    return request;
}