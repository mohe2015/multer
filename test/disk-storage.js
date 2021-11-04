/* eslint-env mocha */

import assert, { ifError, strictEqual } from 'assert'
import deepEqual from 'deep-equal'

import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { file, submitForm, fileSize } from './_util.js'
import multer, { diskStorage } from '../index.js'
import { mkdir, mkdirSync } from 'fs-temp'
import rimraf from 'rimraf'
import FormData from 'form-data'

describe('Disk Storage', function () {
  let uploadDir, upload

  beforeEach(function (done) {
    mkdir(function (err, path) {
      if (err) return done(err)

      uploadDir = path
      upload = multer({ dest: path })
      done()
    })
  })

  afterEach(function (done) {
    rimraf(uploadDir, done)
  })

  it('should process parser/form-data POST request', function (done) {
    const form = new FormData()
    const parser = upload.single('small0')

    form.append('name', 'Multer')
    form.append('small0', file('small0.dat'))

    submitForm(parser, form, function (err, req) {
      ifError(err)

      strictEqual(req.body.name, 'Multer')

      strictEqual(req.file.fieldname, 'small0')
      strictEqual(req.file.originalname, 'small0.dat')
      strictEqual(req.file.size, 1778)
      strictEqual(fileSize(req.file.path), 1778)

      done()
    })
  })

  it('should process empty fields and an empty file', function (done) {
    const form = new FormData()
    const parser = upload.single('empty')

    form.append('empty', file('empty.dat'))
    form.append('name', 'Multer')
    form.append('version', '')
    form.append('year', '')
    form.append('checkboxfull', 'cb1')
    form.append('checkboxfull', 'cb2')
    form.append('checkboxhalfempty', 'cb1')
    form.append('checkboxhalfempty', '')
    form.append('checkboxempty', '')
    form.append('checkboxempty', '')

    submitForm(parser, form, function (err, req) {
      ifError(err)

      strictEqual(req.body.name, 'Multer')
      strictEqual(req.body.version, '')
      strictEqual(req.body.year, '')

      assert(deepEqual(req.body.checkboxfull, ['cb1', 'cb2']))
      assert(deepEqual(req.body.checkboxhalfempty, ['cb1', '']))
      assert(deepEqual(req.body.checkboxempty, ['', '']))

      strictEqual(req.file.fieldname, 'empty')
      strictEqual(req.file.originalname, 'empty.dat')
      strictEqual(req.file.size, 0)
      strictEqual(fileSize(req.file.path), 0)

      done()
    })
  })

  it('should process multiple files', function (done) {
    const form = new FormData()
    const parser = upload.fields([
      { name: 'empty', maxCount: 1 },
      { name: 'tiny0', maxCount: 1 },
      { name: 'tiny1', maxCount: 1 },
      { name: 'small0', maxCount: 1 },
      { name: 'small1', maxCount: 1 },
      { name: 'medium', maxCount: 1 },
      { name: 'large', maxCount: 1 }
    ])

    form.append('empty', file('empty.dat'))
    form.append('tiny0', file('tiny0.dat'))
    form.append('tiny1', file('tiny1.dat'))
    form.append('small0', file('small0.dat'))
    form.append('small1', file('small1.dat'))
    form.append('medium', file('medium.dat'))
    form.append('large', file('large.jpg'))

    submitForm(parser, form, function (err, req) {
      ifError(err)

      assert(deepEqual(req.body, {}))

      strictEqual(req.files.empty[0].fieldname, 'empty')
      strictEqual(req.files.empty[0].originalname, 'empty.dat')
      strictEqual(req.files.empty[0].size, 0)
      strictEqual(fileSize(req.files.empty[0].path), 0)

      strictEqual(req.files.tiny0[0].fieldname, 'tiny0')
      strictEqual(req.files.tiny0[0].originalname, 'tiny0.dat')
      strictEqual(req.files.tiny0[0].size, 122)
      strictEqual(fileSize(req.files.tiny0[0].path), 122)

      strictEqual(req.files.tiny1[0].fieldname, 'tiny1')
      strictEqual(req.files.tiny1[0].originalname, 'tiny1.dat')
      strictEqual(req.files.tiny1[0].size, 7)
      strictEqual(fileSize(req.files.tiny1[0].path), 7)

      strictEqual(req.files.small0[0].fieldname, 'small0')
      strictEqual(req.files.small0[0].originalname, 'small0.dat')
      strictEqual(req.files.small0[0].size, 1778)
      strictEqual(fileSize(req.files.small0[0].path), 1778)

      strictEqual(req.files.small1[0].fieldname, 'small1')
      strictEqual(req.files.small1[0].originalname, 'small1.dat')
      strictEqual(req.files.small1[0].size, 315)
      strictEqual(fileSize(req.files.small1[0].path), 315)

      strictEqual(req.files.medium[0].fieldname, 'medium')
      strictEqual(req.files.medium[0].originalname, 'medium.dat')
      strictEqual(req.files.medium[0].size, 13196)
      strictEqual(fileSize(req.files.medium[0].path), 13196)

      strictEqual(req.files.large[0].fieldname, 'large')
      strictEqual(req.files.large[0].originalname, 'large.jpg')
      strictEqual(req.files.large[0].size, 2413677)
      strictEqual(fileSize(req.files.large[0].path), 2413677)

      done()
    })
  })

  it('should remove uploaded files on error', function (done) {
    const form = new FormData()
    const parser = upload.single('tiny0')

    form.append('tiny0', file('tiny0.dat'))
    form.append('small0', file('small0.dat'))

    submitForm(parser, form, function (err, req) {
      strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
      strictEqual(err.field, 'small0')
      assert(deepEqual(err.storageErrors, []))

      const files = readdirSync(uploadDir)
      assert(deepEqual(files, []))

      done()
    })
  })

  it('should report error when directory doesn\'t exist', function (done) {
    const directory = join(mkdirSync(), 'ghost')
    function dest ($0, $1, cb) { cb(null, directory) }

    const storage = diskStorage({ destination: dest })
    const upload = multer({ storage: storage })
    const parser = upload.single('tiny0')
    const form = new FormData()

    form.append('tiny0', file('tiny0.dat'))

    submitForm(parser, form, function (err, req) {
      strictEqual(err.code, 'ENOENT')
      strictEqual(dirname(err.path), directory)

      done()
    })
  })
})
