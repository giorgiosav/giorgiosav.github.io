state = function(activeLink, linkNumber) {
    if(activeLink === linkNumber) {
        return "active";
    } else {
        return "";
    }
}


navigation = function(activeLink) {

    return `<div id = "navbar-wrapper">
        <ul id = "navigation-bar">
            <li class = "nav-link ` +state(activeLink, 1)+ `"><a href="index.html"><i class = "fa fa-home" style = "font-size:21px"></i></a> </li>
            <li class = "nav-link ` +state(activeLink, 2)+ `"><a href="indice_elettronica.html">Elettronica</a></li>
            <li class = "nav-link ` +state(activeLink, 3)+ `"><a href="indice_fotovoltaici.html">Fotovoltaici</a></li>
            <input type="checkbox" id="nav-sidebar-control">
            <label for="nav-sidebar-control">
            <li class = "nav-link" id = "menu"><i class = "fa fa-bars"></i>
            <div id="sidebar">
                <ul>
                    <li class = "nav-link ` +state(activeLink, 1)+ `"> <a href="index.html"><i class = "fa fa-home"></i></a></li>
                    <li class = "nav-link ` +state(activeLink, 2)+ `"> <a href="indice_elettronica.html">Elettronica</a></li>
                    <li class = "nav-link ` +state(activeLink, 3)+ `"> <a href="indice_fotovoltaici.html">Fotovoltaici</a> </li>
                </ul>
            </div>

            </li>
            </label>
            <li id = "nav-name"> Giorgio Savini </li>
        </ul>
    </div><!-- navbar-wrapper -->`;
}


function togglenote(element) {
    for (let child of element.parentNode.children) {
        if (child.className === "right-note" || child.className === "left-note") {
            if (child.style.display === "none" || child.style.display === "") {
                child.style.display = "inline-block";
            } else {
                child.style.display = "none";
            }
        }
    }
}
