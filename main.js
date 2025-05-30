var svg = d3.select("#map"),
width = +svg.attr("width"),
height = +svg.attr("height"),
tooltip = d3.select("#tooltip");

// World Map Projection
var projection = d3.geoNaturalEarth1().scale(130).translate([width / 2, height / 2]);
var path = d3.geoPath().projection(projection);
var medalData = d3.map();

// color gradient - starts from medium blue instead of very light
function customInterpolateBlues(t) {
    return d3.interpolateBlues(t * 0.7 + 0.3);}
var colorScale = d3.scaleSequential(customInterpolateBlues);

// Load data
d3.queue()
.defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
.defer(d3.csv, "dataset/medals_total.csv", function(d) {
    medalData.set(d.country_code, {
        name: d.country_long || d.country,
        gold: +d["Gold Medal"],
        silver: +d["Silver Medal"],
        bronze: +d["Bronze Medal"],
        total: +d.Total
    });
})
.await(function(error, topo) {
    if (error) throw error;
    
var medalValues = Array.from(medalData.values(), function(d) {
    return d.total;
}).filter(function(d) { return d > 0; });

var maxMedals = d3.max(medalValues) || 1;
colorScale.domain([1, maxMedals]);

// Draw countries
svg.append("g")
    .selectAll("path")
    .data(topo.features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", function(d) {
      var country = medalData.get(d.id);
      if (!country || country.total === 0) return "#e0e0e0";  //grey color for countries with medal count = 0
      return colorScale(country.total);
    })
    .on("mouseover", function(d) {
      var country = medalData.get(d.id) || {
        name: d.properties.name,
        gold: 0, silver: 0, bronze: 0, total: 0
      };

    // Highlight country
    d3.select(this)
        .attr("stroke", "white")
        .attr("stroke-width", "1.5px");
    
    // Update tooltip with medal count
    tooltip.html(`
        <div class="tooltip-title">${country.name}</div>
        <div class="tooltip-value">🥇 ${country.gold}  🥈 ${country.silver}  🥉 ${country.bronze}</div>
        <div class="tooltip-total">Total: ${country.total}</div>
    `)
    .style("opacity", 1);
    })
    .on("mousemove", function(d) {
        tooltip
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 50) + "px");
    })
    .on("mouseout", function() {
        d3.select(this)
            .attr("stroke", "white")
            .attr("stroke-width", "0.7px");
        tooltip.style("opacity", 0);
    });

// legend
var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(30,30)");

var defs = svg.append("defs");
var gradient = defs.append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");

gradient.selectAll("stop")
    .data([
        {offset: "0%", color: customInterpolateBlues(0)},
        {offset: "100%", color: customInterpolateBlues(1)}
    ])
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

legend.append("rect")
    .attr("width", 200)
    .attr("height", 20)
    .style("fill", "url(#gradient)");

var x = d3.scaleLinear()
    .domain([0, maxMedals])
    .range([0, 200]);

legend.append("g")
    .attr("transform", "translate(0,20)")
    .call(d3.axisBottom(x).ticks(5));

legend.append("text")
    .attr("x", 100)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .text("Total Medals");
});