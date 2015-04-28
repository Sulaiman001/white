white
=====

A todo list as simple as a piece of paper - powered by HTML5, CSS, jQuery, Web Sockets, PHP and MongoDB. Lists are always kept up-to-date in real time on all open and running clients via the power of Web Sockets.

List support provide by appending #/list/{listname}/{secret} to URLs, where `{listname}` is anything you want to name your list and `{secret}` is a secret passphrase defined in `bin/config.php`.

Example: `https://www.example.com/white/www/#/list/stuff-to-remember/a39f9b023c023ef20da03`

You may also see all lists in the system at `#/lists/secret-token`. See below in the
INSTALL section for information. You will need to configure at `secret-token`.

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

Copy `bin/example.config.php` to `bin/config.php` and update the Ratchet and MongoDB settings.

Also edit `$cfg['secret']`. This is a secret token that will allow you to view all lists in the system. This hash URL is,

    https://www.example.com/white/www/#/lists/your-secret-token-goes-here

This token should be long an complicated as it will be viewable in the URL.

Copy `www/js/example.config.js` to `www/js/config.js` and update the JavaScript settings.

Open `www/index.php` in a browser.

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
