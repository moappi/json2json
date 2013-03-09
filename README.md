json2json core
=========

What is json2json?
------------------
json2json is a javascript library used to restucture json objects.

Why json2json?
--------------
Some libraries return JSON in an format not easily usable (for example converting xml to json); this is especially so when property names may change depending on the data type involved. The purpose of json2json it to transform unstructured json into the structure that you require.  Features include:

+	Regex expressions on property names
+	Variables (based on regex output)
+	Object extraction 

Example
--------------
Transform 
```javascript
var transform = 
 {'$[var=c:(.+)Chart]':'','chart':'$(var)','stuff':'${c:$(var)Chart.needthis}'}		
```
Plus JSON Data
```javascript
var data = 
 {'c:areaChart':{'needthis':{'propArea':'value'},'dontneedthis':{}},
  'c:pieChart':{'needthis':{'propPie':'value'},'dontneedthis':{}}}		
```
Output JSON Object
```javascript
[{"chart":"area","stuff":{"propArea":"value"}},
 {"chart":"pie","stuff":{"propPie":"value"}}]
```

Need more Information?
--------------
json2json is still in a pre-beta mode (hence the 0.0.1 version) so any changes/improvements are greatly appreciated.




