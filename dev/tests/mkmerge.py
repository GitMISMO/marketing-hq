# Makes merge.html: the save relay door's merge helpers (from shim.html), so the tests' stand-in store merges like the real one.
import sys, re
shim=open(sys.argv[1]).read()
a=shim.index('  function isPlain(v)'); b=shim.index('  function applyOps(')
open(sys.argv[2],'w').write('<script>(function(){ function clone(v){ return v===undefined?undefined:JSON.parse(JSON.stringify(v)); }\n'+shim[a:b]+'\n})();</script>\n')
