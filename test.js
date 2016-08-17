var expect = require('chai').expect
  , client = require('utilise.client')
  , owner  = require('utilise.owner')
  , keys   = require('utilise.keys')
  , key    = require('utilise.key')
  , to     = require('utilise.to')
  , deb    = require('./')
  , iso    = '\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d\\.\\d+([+-][0-2]\\d:[0-5]\\d|Z)'
  , output, realLog, realConsole


describe('deb', function() {

  it('should do nothing if no console.log', function() {
    init('[foo]', function(){
      delete owner.console
      expect(deb('[foo]')('bar')).to.equal('bar')
      expect(output).to.not.be.ok
    })
  })

  it('should log value untouched and return it', function() {
    init('[foo]', function(){
      var o = { a: 1 }
      expect(deb('[foo]')(o)).to.equal(o)
      expect(reg('[foo]').test(output)).to.be.ok
    })
  })

  it('should not log if not in DEBUG', function() {
    init('[foo]', function(){
      expect(deb('[not]')('bar')).to.equal('bar')
      expect(output).to.not.be.ok
    })
  })

  it('should loop over arrays compactly', function() {
    init('[foo]', function(){
      ['a','b','c'].map(deb('[foo]'))
      expect(reg('[foo]').test(output)).to.be.ok
      expect(reg('[foo]', ' a 0 3').test(output)).to.be.ok
      expect(reg('[foo]', ' b 1 3').test(output)).to.be.ok
      expect(reg('[foo]', ' c 2 3').test(output)).to.be.ok
    })
  })

  !client && it('should print in color if exists', function() {
    init('[foo]', function(){
      var realGrey = String.prototype.grey

      String.prototype.grey = 'grey_string'

      expect(deb('[foo]')('bar')).to.equal('bar')
      expect(output).to.be.eql('grey_string bar\n')

      String.prototype.grey = realGrey
    })
  })

  it('should log if DEBUG module wildcard', function() {
    init('*', function(){
      expect(deb('[foo]')('bar')).to.equal('bar')
      expect(reg('[foo]', ' bar').test(output)).to.be.ok
      expect(deb('[foo]:bar')('bar')).to.equal('bar')
      expect(reg('[foo]:bar', ' bar').test(output)).to.be.ok
    })
  })

  it('should log if DEBUG wildcard', function() {
    init('[foo]', function(){
      expect(deb('[foo]')('bar')).to.equal('bar')
      expect(reg('[foo]', ' bar').test(output)).to.be.ok
      expect(deb('[foo/bar]')('bar')).to.equal('bar')
      expect(reg('[foo/bar]', ' bar').test(output)).to.be.ok
    })
  })

  it('should log if DEBUG no submodule', function() {
    init('[foo]', function(){
      expect(deb('[foo]')('bar')).to.equal('bar')
      expect(reg('[foo]', ' bar').test(output)).to.be.ok
      expect(deb('[foo/bar]')('bar')).to.equal('bar')
      expect(reg('[foo/bar]', ' bar').test(output)).to.be.ok
    })
  })

  it('should log if DEBUG submodule', function() {
    init('[foo/bar]', function(){
      expect(deb('[foo]')('bar')).to.equal('bar')
      expect(reg('[foo]', ' bar').test(output)).to.not.be.ok
      expect(deb('[foo/baz]')('bar')).to.equal('bar')
      expect(reg('[foo/baz]', ' bar').test(output)).to.not.be.ok
      expect(deb('[foo/bar]')('bar')).to.equal('bar')
      expect(reg('[foo/bar]', ' bar').test(output)).to.be.ok
    })
  })

  it('should log with multiple DEBUG', function() {
    init('[foo/bar],foo/baz', function(){
      expect(deb('[foo]')('bar')).to.equal('bar')
      expect(reg('[foo]', ' bar').test(output)).to.not.be.ok
      expect(deb('[foo/baz]')('bar')).to.equal('bar')
      expect(reg('[foo/baz]', ' bar').test(output)).to.be.ok
      expect(deb('[foo/bar]')('bar')).to.equal('bar')
      expect(reg('[foo/bar]', ' bar').test(output)).to.be.ok
    })
  })

  it('should work in with querystring', function() {
    init('?debug=[foo/bar],foo/baz', function(){
      expect(deb('[foo]')('bar')).to.equal('bar')
      expect(reg('[foo]', ' bar').test(output)).to.not.be.ok
      expect(deb('[foo/baz]')('bar')).to.equal('bar')
      expect(reg('[foo/baz]', ' bar').test(output)).to.be.ok
      expect(deb('[foo/bar]')('bar')).to.equal('bar')
      expect(reg('[foo/bar]', ' bar').test(output)).to.be.ok
    }, true)
  })

  it('should work with no querystring', function() {
    init('', function(){
      expect(deb('[foo]')('bar')).to.equal('bar')
      expect(reg('[foo]', ' bar').test(output)).to.not.be.ok
      expect(deb('[foo/baz]')('bar')).to.equal('bar')
      expect(reg('[foo/baz]', ' bar').test(output)).to.not.be.ok
      expect(deb('[foo/bar]')('bar')).to.equal('bar')
      expect(reg('[foo/bar]', ' bar').test(output)).to.not.be.ok
    }, true)
  })

  it('should not log anything with no DEBUG', function() {
    init('', function(){
      expect(deb('[foo]')('bar')).to.equal('bar')
      expect(reg('[foo]', ' bar').test(output)).to.not.be.ok
      expect(deb('[foo/bar]')('bar')).to.equal('bar')
      expect(reg('[foo/bar]', ' bar').test(output)).to.be.not.ok
    })
  })

  it('should skip invalid values', function() {
    init('///', function(){
      expect(deb('[foo]')('bar')).to.equal('bar')
      expect(reg('[foo]', ' bar').test(output)).to.not.be.ok
      expect(deb('[foo/bar]')('bar')).to.equal('bar')
      expect(reg('[foo/bar]', ' bar').test(output)).to.be.not.ok
    })
  })

})

function init(DEBUG, fn, browser){
  window = browser ? global : undefined
  keys(require.cache).map(d => delete require.cache[d])
  owner = require('utilise.owner')
  key('location.search', '')(owner)
  key('process.env.DEBUG', '')(owner)
  browser 
    ? key('location.search', DEBUG)(owner)
    : key('process.env.DEBUG', DEBUG)(owner)
  deb = require('./')

  output = '' 
  /* istanbul ignore next */
  if (!owner.console) return
  realConsole = owner.console
  realLog     = owner.console.log
  owner.console.log = function(){
    realLog.apply(realConsole, arguments)
    output += to.arr(arguments).join(' ') + '\n'
  }
  try { fn() } finally {
    owner.console     = realConsole
    owner.console.log = realLog
  }
}

function reg(ns, info) {
  return new RegExp('\\[deb\\]\\['+iso+'\\]'+ ns.replace(/(\[|\])/g, '\\$1') + (info || ''), 'mg')
}