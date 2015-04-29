white
=====

A todo list as simple as a piece of paper - powered by HTML5, CSS, jQuery, Web Sockets, PHP and MongoDB. Lists are always kept up-to-date in real time on all open and running clients via the power of Web Sockets.

List support provide by appending #/list/{listname}/{secret} to URLs, where `{listname}` is anything you want to name your list and `{secret}` is a secret passphrase defined in `bin/config.php`.

Example: `https://www.example.com/white/www/#/list/stuff-to-remember/a39f9b023c023ef20da03`

You may also see all lists in the system at `#/lists/secret-token`. See below in the
INSTALL section for information. You will need to configure at `secret-token`.

Syntax
======
_Note: Sorting and due date reminders will be available soon, however the syntax is ready and parsed so you will see nicely styled HTML. It just won't be functional._

Each todo item is a single line of text.

URLs and emails will automatically be linked using [Autolinker.js](https://github.com/gregjacobs/Autolinker.js).

There are 3 special labels: priority, label, and due date. See the following example todo items for usage.

A priority is represented by an exclamation mark followed by an integer. The higher the integer, the higher the priority. A todo item may only contain one of these. Items will be sorted accordingly - the higher priorities towards the top.

    !10

A label is represented by a pound symbol followed by a word containing only lower and upper case letters, numbers, underscores, and dashes. Labels are used for grouping and sorting todo list items. A todo list item may contain any number of labels.

    #these #are #labels

A due date is an @ symbol followed by a due date inside of left and right angle brackets. Once the todo list item is saved the date is parsed with the UNIX `at` command and the syntax is stripped so that you don't queue the todo item again.

    @<12:00 4/28/2015>

The date must follow a valid `at` time convention gathered from http://www.computerhope.com/unix/uat.htm

    noon               => 12:00 PM October 18 2014
    midnight           => 12:00 AM October 19 2014
    teatime            => 4:00 PM October 18 2014
    tomorrow           => 10:00 AM October 19 2014
    noon tomorrow      => 12:00 PM October 19 2014
    next week          => 10:00 AM October 25 2014
    next monday        => 10:00 AM October 24 2014
    fri                => 10:00 AM October 21 2014
    NOV                => 10:00 AM November 18 2014
    9:00 AM            => 9:00 AM October 19 2014
    2:30 PM            => 2:30 PM October 18 2014
    1430               => 2:30 PM October 18 2014
    2:30 PM tomorrow   => 2:30 PM October 19 2014
    2:30 PM next month => 2:30 PM November 18 2014
    2:30 PM Fri        => 2:30 PM October 21 2014
    2:30 PM 10/21      => 2:30 PM October 21 2014
    2:30 PM Oct 21     => 2:30 PM October 21 2014
    2:30 PM 10/21/2014 => 2:30 PM October 21 2014
    2:30 PM 21.10.14   => 2:30 PM October 21 2014
    now + 30 minutes   => 10:30 AM October 18 2014
    now + 1 hour       => 11:00 AM October 18 2014
    now + 2 days       => 10:00 AM October 20 2014
    4 PM + 2 days      => 4:00 PM October 20 2014
    now + 3 weeks      => 10:00 AM November 8 2014
    now + 4 months     => 10:00 AM February 18 2015
    now + 5 years      => 10:00 AM October 18 2019

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
