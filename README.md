# encrypter

A small script to encrypt files and directories using AES-256-GCM that uses a user provided password, hashed using SHA256, as the encryption key

# Quick Start

Install dependencies

```console
npm install
```

Running from npm script

```console
npm start -- lock mypassword file.txt
```

To run from the `encrypter` command see [Installation](#installation) below

# Commands

`lock`

Must be given a password and a relative path to a file or directory

> Will ignore files with the `.encrypted` extension

`unlock`

Must be given a password and a relative path to a file or directory

> Will ignore files without the `.encrypted` extension

# Installation

Install dependencies

```console
npm install
```

Build executable script

```console
npm run build
```

A file named `encrypter` will now be in the project root. You can place this in any directory that is in your user PATH to execute from anywhere. For example I have the `~/bin` directory in my PATH.

Running from installation

```console
encrypter lock mypassword file.txt
```

# Project Remarks

There are some features / enhancements that I've day-dreamed about / would be nice to have, but the project hits all the points I need to utilize it, so they're just going to get listed out here.

- Encryption & signing to allow sending of files to an intended recipient using public / private keys
- Proper CLI features (help command, better error messaging, version command)
- Async encryption / decryption of directories, which is currently done synchronously