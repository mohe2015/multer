/* eslint-env mocha */

import { ifError, ok, strictEqual } from 'assert'

import { file as _file, submitForm, fileSize } from './_util.js'
import multer, { diskStorage } from '../index.js'
import { mkdir, template } from 'fs-temp'
import pkg from 'rimraf'
import FormData from 'form-data'
const { sync } = pkg

function generateFilename (req, file, cb) {
  cb(null, file.fieldname + file.originalname)
}

function startsWith (str, start) {
  return (str.substring(0, start.length) === start)
}

describe('Functionality', function () {
  const cleanup = []

  function makeStandardEnv (cb) {
    mkdir(function (err, uploadDir) {
      if (err) return cb(err)

      cleanup.push(uploadDir)

      const storage = diskStorage({
        destination: uploadDir,
        filename: generateFilename
      })

      cb(null, {
        upload: multer({ storage: storage }),
        uploadDir: uploadDir,
        form: new FormData()
      })
    })
  }

  after(function () {
    while (cleanup.length) sync(cleanup.pop())
  })

  it('should upload the file to the `dest` dir', function (done) {
    makeStandardEnv(function (err, env) {
      if (err) return done(err)

      const parser = env.upload.single('small0')
      env.form.append('small0', _file('small0.dat'))

      submitForm(parser, env.form, function (err, req) {
        ifError(err)
        ok(startsWith(req.file.path, env.uploadDir))
        strictEqual(fileSize(req.file.path), 1778)
        done()
      })
    })
  })

  it('should rename the uploaded file', function (done) {
    makeStandardEnv(function (err, env) {
      if (err) return done(err)

      const parser = env.upload.single('small0')
      env.form.append('small0', _file('small0.dat'))

      submitForm(parser, env.form, function (err, req) {
        ifError(err)
        strictEqual(req.file.filename, 'small0small0.dat')
        done()
      })
    })
  })

  it('should ensure all req.files values (single-file per field) point to an array', function (done) {
    makeStandardEnv(function (err, env) {
      if (err) return done(err)

      const parser = env.upload.single('tiny0')
      env.form.append('tiny0', _file('tiny0.dat'))

      submitForm(parser, env.form, function (err, req) {
        ifError(err)
        strictEqual(req.file.filename, 'tiny0tiny0.dat')
        done()
      })
    })
  })

  it('should ensure all req.files values (multi-files per field) point to an array', function (done) {
    makeStandardEnv(function (err, env) {
      if (err) return done(err)

      const parser = env.upload.array('themFiles', 2)
      env.form.append('themFiles', _file('small0.dat'))
      env.form.append('themFiles', _file('small1.dat'))

      submitForm(parser, env.form, function (err, req) {
        ifError(err)
        strictEqual(req.files.length, 2)
        strictEqual(req.files[0].filename, 'themFilessmall0.dat')
        strictEqual(req.files[1].filename, 'themFilessmall1.dat')
        done()
      })
    })
  })

  it('should rename the destination directory to a different directory', function (done) {
    const storage = diskStorage({
      destination: function (req, file, cb) {
        template('testforme-%s').mkdir(function (err, uploadDir) {
          if (err) return cb(err)

          cleanup.push(uploadDir)
          cb(null, uploadDir)
        })
      },
      filename: generateFilename
    })

    const form = new FormData()
    const upload = multer({ storage: storage })
    const parser = upload.array('themFiles', 2)

    form.append('themFiles', _file('small0.dat'))
    form.append('themFiles', _file('small1.dat'))

    submitForm(parser, form, function (err, req) {
      ifError(err)
      strictEqual(req.files.length, 2)
      ok(req.files[0].path.indexOf('/testforme-') >= 0)
      ok(req.files[1].path.indexOf('/testforme-') >= 0)
      done()
    })
  })
})
