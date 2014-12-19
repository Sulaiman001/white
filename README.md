white
=====

A todo list as simple as a piece of paper - powered by HTML5, CSS, jQuery, PHP and MongoDB.

Update the MongoDB URL at the top of `ajax.php` and open `index.php` in a browser.

List support provide by appending #/list/{listname} to URLs.

Example: `https://www.example.com/white/www/#/list/stuff-to-remember`

INSTALL
=======

Install composer dependencies, or `update` if upgrading white.

```bash
composer.phar install
```

Run white websocket server. Edit the `bindir` variable to point to the `bin` directory in the file `bin/run.sh`. Then execute the `bin/run.sh` script.

```bash
cd /path/to/white
bin/run.sh
```

Copy `bin/example.config.php` to `bin/config.php` and update the Ratchet server settings.

Copy `www/js/example.config.js` to `www/js/config.js` and update the JavaScript settings.

Setup Stunnel for SSL encryption for secure web sockets
========================================================

The `www/js/example.config.js` file defaults to the `ws://` protocol on port 9880.

The port used in `bin/example.config.php` and `www/js/example.config.js` are both 9880.

When you switch to using a secure websocket with protocol `wss://` you will need to change the port in `www/js/example.config.js` to 9443 if using the stunnel configuration below. On many machines edit `/etc/stunnel/stunnel.conf` and add the following. You'll need to generate a certificate if you don't have one. You can get free SSL certificates from sites like startssl.com.

    cert = /etc/apache2/ssl/cert.pem

    [white]
    accept = YOUR_PUBLIC_IP_ADDRESS:9443
    connect = 127.0.0.1:9880

Restart stunnel.
