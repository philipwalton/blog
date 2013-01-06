.widget {

}

.widget-modified {
  extends: .widget
}


.page-body %widget {

}

{% highlightjs %}
<div class="widget-modified" />
{% endhighlightjs %}

el = document.querySelectorAll(".page-body %widget")[0]

// determine inheritence
el.matchesSelector("%widget")
- or -
el.extendsClass("widget") // true

// get class list currently
el.classList // ["widget-modified"]

// get inherited class list
el.classExtensions // ["widget"]