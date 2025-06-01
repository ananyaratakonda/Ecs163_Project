const width = window.innerWidth;
const height = window.innerHeight;

//sankey chart dimensions
let sankeyLeft = 200, sankeyTop = 20;
let sankeyMargin = {top: 10, right: 30, bottom: 30, left: 60},
    sankeyWidth = (width / 2) - sankeyMargin.left - sankeyMargin.right - 20,
    sankeyHeight = height - 50;

const { sankey, sankeyLinkHorizontal } = d3;
// load data from medals.csv
d3.csv("dataset/medals.csv").then(rawData => {
    console.log("rawData", rawData);
    
    // creates a sankey chart for a given country
    function makeSankey(countryName, rawData){
        // color mapping for medal type
        const color = d3.scaleOrdinal()
            .domain(["Gold Medal", "Silver Medal", "Bronze Medal"])
            .range(["#FFD700", "#C0C0C0", "#CD7F32"]);

        const medalColors = new Set(["Gold Medal", "Silver Medal", "Bronze Medal"])

        // sankey chart setup
        const sankeygraph = sankey()
            .nodeWidth(20)
            .nodePadding(10)
            .extent([[0, 0], [sankeyWidth, sankeyHeight]]);

        // create a set of nodes and links
        const nodesSet = new Set();
        const linkCounts = {};

        // filters the data for only the selected country
        const country = rawData.filter(d => d.country === countryName);

        // counts the number of medals won for each discipline
        const countDisciplines = d3.rollups(
            country, 
            v => v.length, 
            d => d.discipline
        );

        // selects the top 10 disciplines based on the number of medals won
        const top10 = new Set(
            countDisciplines
                .sort((a, b) => d3.descending(a[1], b[1]))
                .slice(0, 10)
                .map(d => d[0])
        );

        // color mapping for top 10 disciplines
        const top10color = d3.scaleOrdinal()
            .domain(top10)
            .range(d3.schemeTableau10);

        // creates the nodes and links for the sankey chart
        country.forEach(d => {
            if (top10.has(d.discipline)) {
                const source = d.medal_type;
                const target = d.discipline;
                nodesSet.add(source);
                nodesSet.add(target);   

                const key = `${source}->${target}`;
                linkCounts[key] = (linkCounts[key] || 0) + 1;
            }
        });

        // maps the nodes and links to the sankey chart format
        const nodes = Array.from(nodesSet).map(name => ({ name }));
        const nameToIndex = Object.fromEntries(nodes.map((d, i) => [d.name, i]));

        const links = Object.entries(linkCounts).map(([key, value]) => {
            const [src, tgt] = key.split("->");
            return {
                source: nameToIndex[src],
                target: nameToIndex[tgt],
                value: value
            };
        });

        // positions the nodes and links in the sankey chart
        const graph = sankeygraph({
            nodes: nodes.map(d => Object.assign({}, d)),
            links: links
        });

        const svg = d3.select("#svg")
            .attr("width", width)
            .attr("height", height);

        svg.selectAll("*").remove();

        // draws the paths between the nodes
        const sankeyGroup = svg.append("g")
            .attr("transform", `translate(${sankeyLeft}, ${sankeyTop})`);

        const tooltip = d3.select("#tooltip");

        sankeyGroup.append("g")
            .attr("fill", "none")
            .selectAll("path")
            .data(graph.links)
            .join("path")
            .attr("d", sankeyLinkHorizontal())
            .attr("stroke-width", d => Math.max(1, d.width))
            .attr("stroke", d => color(d.source.name))
            .attr("opacity", 0.7)
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                console.log("clicked on", d.source.name, "->", d.target.name);
            })
            //adding tooltip
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .text(`${d.source.name} → ${d.target.name}: ${d.value} medals`);
            })
            .on("mousemove", event => {
                tooltip.style("top", (event.pageY + 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

        // draws the nodes in the sankey chart
        const node = sankeyGroup.append("g")
            .selectAll("rect")
            .data(graph.nodes)
            .join("g")
        
        // styles and adds the rectangles for each node
        node.append("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", d => medalColors.has(d.name) ? color(d.name) : top10color(d.name))
            .attr("stroke", "#000");

        // adds the labels for each node
        node.append("text")
            .attr("x", d => d.x0 - 6)
            .attr("y", d => (d.y0 + d.y1) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(d => d.name);

    }
    
    // default sankey chart
    makeSankey("United States", rawData);



    
});
