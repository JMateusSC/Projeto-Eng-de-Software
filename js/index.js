/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
window.addEventListener('load', onDeviceReady, false);

function onDeviceReady() {
    function graph() { 
        var data = [];
        const vw = window.innerWidth, vh = 200, margin = 40;
        var circles_radius = 5;

        function draw() {
            try {
                data = JSON.parse(this.responseText);
            } catch (error) {
                console.log("Unable to get the data on the response:\n"+this.responseText);
                return 0;
            }   
            if(data.length == 0) {
                
                current_temp.innerHTML = "--";
                current_hum.innerHTML = "--";
                graphic_box.innerHTML = `<p class="msg">No data</p>`;
                return 0;
            }
            graphic_box.innerHTML = ``;
            current_temp.innerHTML = data[0].temperatura + "°C";
            current_hum.innerHTML = data[0].umidade + "%";

            // Make the svg graphic
            const svg = create("svg");
            svg.setAttribute("width", `${window.innerWidth}px`);
            svg.setAttribute("height", "100%");
            svg.setAttribute("viewport", `0 0 ${vw} ${vh}`);
            graphic_box.appendChild(svg);

            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                item.ty = item.temperatura;
                item.uy = item.umidade;
            }

            //Left Vertical Axis (Temperature)
            let tmin = data[0].temperatura; tmax = tmin;
            for (let i = 1; i < data.length; i++) {
                const item = data[i], t = item.temperatura;
                if(t < tmin) tmin = t;
                else if(t > tmax) tmax = t;
            }
            let t_variation = tmax - tmin;
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                item.ty = vh - margin - (item.temperatura - tmin) / t_variation * (vh - 2*margin);
            }

            const lv_axis = create("g");
            set(lv_axis, {class: "axis left"});
            svg.append(lv_axis);

            const p1 = create("path");
            for (let i = tmax; i >= tmin; i-=t_variation/5) {
                const text = create("text"), y = vh - margin - (i - tmin) / t_variation * (vh - 2*margin);
                set(text, {x: 5, y: y});
                text.innerHTML = i.toString().slice(0, 5);
                lv_axis.appendChild(text);
                const line = create("path");
                set(line, {d: `M ${margin-3} ${y} l 6 0`});
                lv_axis.appendChild(line);
            }
            set(p1, {d: `M ${margin} 10 L ${margin} 200`});
            const desc = create("text");
            set(desc, {x: 10, y: 20});
            desc.innerHTML = "T (°C)";
            lv_axis.appendChild(desc);
            lv_axis.append(p1);

            //Right Vertical Axis (Humidity)
            let umin = data[0].umidade; umax = umin;
            for (let i = 1; i < data.length; i++) {
                const item = data[i], u = item.umidade;
                if(u < umin) umin = u;
                else if(u > umax) umax = u;
            }
            let u_variation = umax - umin;
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                item.uy = vh - margin - (item.umidade - umin) / u_variation * (vh - 2*margin);
            }

            const rv_axis = create("g");
            set(rv_axis, {class: "axis left"});
            svg.append(rv_axis);
            const p2 = create("path");
            for (let i = umax; i >= umin; i-=u_variation/5) {
                const text = create("text"), y = vh - margin - (i - umin) / u_variation * (vh - 2*margin);
                set(text, {x: vw - margin + 5, y: y});
                text.innerHTML = i.toString().slice(0, 5);
                rv_axis.appendChild(text);
                const line = create("path");
                set(line, {d: `M ${vw - margin-3} ${y} l 6 0`});
                rv_axis.appendChild(line);
            }
            set(p2, {d: `M ${vw - margin} 10 l 0 190`});
            rv_axis.append(p2);

            const desc2 = create("text");
            set(desc2, {x: vw - margin + 3, y: 20});
            desc2.innerHTML = "U (%)";
            rv_axis.appendChild(desc2);

            //Horizontal Axis (Time)
            const last = data.length-1;
            let spacing = vw - 2*margin;
            let min = (new Date(data[last].tempo)).getTime();
            let max = (new Date(data[0].tempo)).getTime();
            let time_variation = max - min;
            spacing /= time_variation;
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                item.x = margin + ((new Date(data[i].tempo)).getTime() - min) * spacing;
            }

            const h_axis = create("g");
            set(h_axis, {class: "axis bottom"});
            svg.append(h_axis);
            const p3 = create("path");

            const text1 = create("text");
            set(text1, {x: margin+2, y: vh - 10});
            const d1 = new Date(min - 3*60*60*1000);
            text1.innerHTML = date(d1);
            h_axis.appendChild(text1);

            const text2 = create("text");
            set(text2, {x: vw - 130, y: vh - 10});
            const d2 = new Date(max - 3*60*60*1000);
            text2.innerHTML = date(d2);
            h_axis.appendChild(text2);

            set(p3, {d: `M 0 ${vh - margin/2} l ${vw} 0`});
            h_axis.append(p3);

            //Points and lines for Temperature
            const temparatures = create("g");
            set(temparatures, {class: "temperatures"});
            svg.append(temparatures);

            const t_path = create("path");
            let d = `M ${data[last].x} ${data[last].ty} L`;
            for (let i = last; i >= 0; i--) {
                const item = data[i];
                point(temparatures, item.x, item.ty, item.temperatura);
                d += ` ${item.x},${item.ty}`;
            }
            set(t_path, {d: d});
            temparatures.append(t_path);

            //Points and lines for Humidity
            const humidities = create("g");
            set(humidities, {class: "humidities"});
            svg.append(humidities);

            const u_path = create("path");
            d = `M ${data[last].x} ${data[last].uy} L`;
            for (let i = last; i >= 0; i--) {
                const item = data[i];
                point(humidities, item.x, item.uy, item.umidade);
                d += ` ${item.x},${item.uy}`;
            }
            set(u_path, {d: d});
            humidities.append(u_path);
        } 
        function update() {
            let url = `http://testess.atwebpages.com/api.php?n=${number_of_entries.value}`;

            const xhttp = new XMLHttpRequest();
            xhttp.onload = draw;
            xhttp.open("GET", url);
            xhttp.send();

            //setTimeout(update, 5000);
        }
        function create(tag) {
            return document.createElementNS("http://www.w3.org/2000/svg", tag);
        }
        function point(parent, x, y, text = "") {
            const g = create("g");
            set(g, {class: "point"});
            parent.appendChild(g);
            
            const circle = create("circle");
            set(circle, {cx: x, cy: y, r: circles_radius});
            g.append(circle);

            const tooltip = create("text");
            set(tooltip, {x: x+circles_radius+1, y: y+circles_radius+1});
            tooltip.innerHTML = text;
            g.appendChild(tooltip);
            circle.addEventListener("click", ()=>{g.classList.toggle("click")});
        }
        function set(node, attrs) {
            for (const key in attrs) {
                if (attrs.hasOwnProperty(key)) {
                    const v = attrs[key];
                    node.setAttribute(key, v);
                }
            }
        }
        function date(d) {
            return `${d.getDay()}-${d.getMonth()}-${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
        }
        graph.update = update;
        update();
    }
    graph();

    number_of_entries.addEventListener("change", graph.update);
}
