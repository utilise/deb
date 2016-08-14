var expect = require('chai').expect
  , client = require('utilise.client')
  , owner  = require('utilise.owner')
  , to     = require('utilise.to')
  , deb    = require('./')
  , iso    = '\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d\\.\\d+([+-][0-2]\\d:[0-5]\\d|Z)'
  , output, realLog, realConsole

describe('deb', function() {

  it('should do nothing if no console.log', function() {
    init(function(){
      delete owner.console
      expect(deb('[foo]')('bar')).to.equal('bar')
      expect(output).to.not.be.ok
    })
  })

  it('should log value untouched and return it', function() {
    init(function(){
      var o = { a: 1 }
      expect(deb('[foo]')(o)).to.equal(o)
      expect(reg('foo').test(output)).to.be.ok
    })
  })

  it('should loop over arrays compactly', function() {
    init(function(){
      ['a','b','c'].map(deb('[foo]'))
      expect(reg('foo').test(output)).to.be.ok
      expect(reg('foo', ' a 0 3').test(output)).to.be.ok
      expect(reg('foo', ' b 1 3').test(output)).to.be.ok
      expect(reg('foo', ' c 2 3').test(output)).to.be.ok
    })
  })

  !client && it('should print in color if exists', function() {
    init(function(){
      var realGrey = String.prototype.grey

      String.prototype.grey = 'grey_string'

      expect(deb('foo')('bar')).to.equal('bar')
      expect(output).to.be.eql('grey_string bar\n')

      String.prototype.grey = realGrey
    })
  })

})

function init(fn){
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
  return new RegExp('\\[deb\\]\\['+iso+'\\]\\['+ns+'\\]' + (info || ''), 'mg')
}