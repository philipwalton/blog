<!--
{
  "layout": "article",
  "title": "Measuring Your Site's Responsive Breakpoint Usage",
  "date": "2014-12-18T09:37:36-08:00",
  "tags": [
    "JavaScript",
    "CSS"
  ]
}
-->

We all know that mobile is a big deal, and the number of people accessing the web from mobile devices is increasing, rapidly, every year. You may have read headlines or heard statistics cites facts like: *now XX percentage of Facebook user browse the site from mobiles phones!*

It can be easy to hear statistics like that and extrapolate that you need to drop everything and build a mobile friends site immediately.

Now, I'm not saying you shouldn't build a mobile friendly site (in fact, you probably should), I'm just saying you shouldn't build it just because you read a headline about global (of a single site's) mobile usages share increasing.

If you have limited resources, you need to apply those resources to areas where they'll have the most impact. And the only way to know what will have the most impact is to measure the trends of your existing users.

Most web tracking tools (like Google Analytics) will, without any special configuration, parse the user agent string and record things like the browser, operating system, and the version of each. From this data these tools can usually tell you what devices your visitors are using. Yes, these values can be spoofed, but for the most part, and given a decent samples size, this data will be very accurate.

However, if you build your sites using response design, the type of device being used may not be particularly helpful information.
