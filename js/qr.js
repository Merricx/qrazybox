const WHITE_COLOR = 0;
const BLACK_COLOR = 1;
const RED_COLOR = 3;
const GREY_COLOR = -1;

/*
    A finder is defined by 3 squares:
    - A black 7x7 square
    - A white 5x5 square
    - A black 3x3 square

    Padding is denoted by a 9x9 square surrounding the element
    and being cropped on its corners.

    x and y denote the (x,y) coordinate of the 7x7 square, taken
    at the top left corner
*/

function draw_square(t, x, y, size, color){
    for(let i=x; i<x+size; i++){
        for(let j=y; j<y+size; j++){
            if(i >= t.length || i < 0){
                continue
            }
            if(j >= t.length || j < 0) {
                continue
            }
            t[i][j] = color;
        }
    }
}

function generate_finder_separator(t, x, y) {
    return draw_square(t, x - 1, y - 1, 9, WHITE_COLOR);
}

function generate_finder(t, x, y){
    generate_finder_separator(t, x, y);
    draw_square(t, x, y, 7, BLACK_COLOR);
    draw_square(t, x + 1, y + 1, 5, WHITE_COLOR);
    draw_square(t, x + 2, y + 2, 3, BLACK_COLOR);
}

/*
    The timing patterns is a pattern of black / white squares (1x1) that
    begin with a black one and move either horizontally or vertically,
    connecting the finders separators.
*/
function generate_timing_pattern_v(t, xStart, yStart, yEnd){
    // Start with black
    let current = BLACK_COLOR;
    for(let j=yStart; j<=yEnd; j++){
        t[xStart][j] = current;
        current = (current == BLACK_COLOR ? WHITE_COLOR : BLACK_COLOR)
    }
}

function generate_timing_pattern_h(t, xStart, yStart, xEnd){
    // Start with black
    let current = BLACK_COLOR;
    for(let i=xStart; i<=xEnd; i++){
        t[i][yStart] = current;
        current = (current == BLACK_COLOR ? WHITE_COLOR : BLACK_COLOR)
    }
}


let versions_size = [];
for(let i=0;i<40;i++){
    versions_size.push(
        [21 + i*4, 21 + i*4]
    )
}

let alignment_lookup = [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
    [6, 30, 54, 78],
    [6, 30, 56, 82],
    [6, 30, 58, 86],
    [6, 34, 62, 90],
    [6, 28, 50, 72, 94],
    [6, 26, 50, 74, 98],
    [6, 30, 54, 78, 102],
    [6, 28, 54, 80, 106],
    [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114],
    [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122],
    [6, 30, 54, 78, 102, 126],
    [6, 26, 52, 78, 104, 130],
    [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138],
    [6, 30, 58, 86, 114, 142],
    [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150],
    [6, 24, 50, 76, 102, 128, 154],
    [6, 28, 54, 80, 106, 132, 158],
    [6, 32, 58, 84, 110, 136, 162],
    [6, 26, 54, 82, 110, 138, 166],
    [6, 30, 58, 86, 114, 142, 170]
];


/*
    Alignment patterns are boxes sized 5x5 that are
    formed as follows:

    - Outer 5x5 black square
    - Inner 3x3 white square
    - Inner-most 1x1 black square

    The coordinates from alignment_lookup refer to the center
    of the alignment pattern (the 1x1 square).
*/

function add_alignment_patterns(t, index){
    let alignment = alignment_lookup[index];
    if(alignment.length == 0){
        return;
    }

    let alignment_locs = [];

    for(let i=0; i<alignment.length; i++){
        for(let j=0; j<alignment.length; j++){
            alignment_locs.push([alignment[i], alignment[j]]);
        }
    }

    for(let align of alignment_locs){
        let [x, y] = [align[0], align[1]];

        let [l_x, r_x] = [x-2, x+2];
        let [t_y, b_y] = [y-2, y+2];

        if(r_x > t.length - 8 && t_y < 8) {
            continue
        }

        if(l_x < 8 && t_y < 8) {
            continue;
        }

        if(l_x < 8 && b_y > t.length - 8){
            continue
        }

        draw_square(t, x-2, y-2, 5, BLACK_COLOR);
        draw_square(t, x-1, y-1, 3, WHITE_COLOR);
        draw_square(t, x, y, 1, BLACK_COLOR);

        
    }
    console.log(alignment_locs);
}

// from table.js  version_information_table ( left most bit is still position 17 )
var version_information_table_bit = [
	[0,0,0,1,1,1,1,1,0,0,1,0,0,1,0,1,0,0],			//7
	[0,0,1,0,0,0,0,1,0,1,1,0,1,1,1,1,0,0],			//8	
	[0,0,1,0,0,1,1,0,1,0,1,0,0,1,1,0,0,1],			//9
	[0,0,1,0,1,0,0,1,0,0,1,1,0,1,0,0,1,1],         //10
	[0,0,1,0,1,1,1,0,1,1,1,1,1,1,0,1,1,0],         //11
	[0,0,1,1,0,0,0,1,1,1,0,1,1,0,0,0,1,0],         //12
	[0,0,1,1,0,1,1,0,0,0,0,1,0,0,0,1,1,1],         //13
	[0,0,1,1,1,0,0,1,1,0,0,0,0,0,1,1,0,1],         //14
	[0,0,1,1,1,1,1,0,0,1,0,0,1,0,1,0,0,0],         //15
	[0,1,0,0,0,0,1,0,1,1,0,1,1,1,1,0,0,0],         //16
	[0,1,0,0,0,1,0,1,0,0,0,1,0,1,1,1,0,1],         //17
	[0,1,0,0,1,0,1,0,1,0,0,0,0,1,0,1,1,1],         //18
	[0,1,0,0,1,1,0,1,0,1,0,0,1,1,0,0,1,0],         //19
	[0,1,0,1,0,0,1,0,0,1,1,0,1,0,0,1,1,0],         //20
	[0,1,0,1,0,1,0,1,1,0,1,0,0,0,0,0,1,1],         //21
	[0,1,0,1,1,0,1,0,0,0,1,1,0,0,1,0,0,1],         //22
	[0,1,0,1,1,1,0,1,1,1,1,1,1,0,1,1,0,0],         //23
	[0,1,1,0,0,0,1,1,1,0,1,1,0,0,0,1,0,0],         //24
	[0,1,1,0,0,1,0,0,0,1,1,1,1,0,0,0,0,1],         //25
	[0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],         //26
	[0,1,1,0,1,1,0,0,0,0,1,0,0,0,1,1,1,0],         //27
	[0,1,1,1,0,0,1,1,0,0,0,0,0,1,1,0,1,0],         //28
	[0,1,1,1,0,1,0,0,1,1,0,0,1,1,1,1,1,1],         //29
	[0,1,1,1,1,0,1,1,0,1,0,1,1,1,0,1,0,1],         //30
	[0,1,1,1,1,1,0,0,1,0,0,1,0,1,0,0,0,0],         //31
	[1,0,0,0,0,0,1,0,0,1,1,1,0,1,0,1,0,1],         //32
	[1,0,0,0,0,1,0,1,1,0,1,1,1,1,0,0,0,0],         //33
	[1,0,0,0,1,0,1,0,0,0,1,0,1,1,1,0,1,0],         //34
	[1,0,0,0,1,1,0,1,1,1,1,0,0,1,1,1,1,1],         //35
	[1,0,0,1,0,0,1,0,1,1,0,0,0,0,1,0,1,1],         //36
	[1,0,0,1,0,1,0,1,0,0,0,0,1,0,1,1,1,0],         //37
	[1,0,0,1,1,0,1,0,1,0,0,1,1,0,0,1,0,0],         //38
	[1,0,0,1,1,1,0,1,0,1,0,1,0,0,0,0,0,1],         //39
	[1,0,1,0,0,0,1,1,0,0,0,1,1,0,1,0,0,1]		   //40
];

function add_version_info(t, version){
    if (version >= 7)	{
        for (step=0 ; step < 3 ; step++ ){
            x=0;
            for(let i = 17 - step; i>=0 ; i -=  3){
                // Bottom Left
                draw_square(t,  4*version + 6 + step, x ,1, version_information_table_bit[version - 7][i]);
                // Top Right
                draw_square(t,  x,  4*version + 6 + step ,1, version_information_table_bit[version - 7][i]);
                x++;
            }
        }
    }
    return t;
}

// https://www.thonky.com/qr-code-tutorial/format-version-information
function add_dark_module(t, version){
    //dark module is always (8, 4*version + 9)
    draw_square(t,  4*version + 9, 8 ,1, BLACK_COLOR);
    return t;
}



function generate_qr(version){
    console.log(`Generating ${version}`)
    let t = [];
    let sizes = versions_size[version-1];
    let x_max = sizes[0];
    let y_max = sizes[1];

    for(let i = 0; i<x_max; i++){
        let arr = [];
        for(let j=0; j<y_max; j++){
            arr.push(GREY_COLOR);
        }
        t.push(arr);
    }

    // Add finder
    generate_finder(t, 0, 0);
    generate_finder(t, x_max - 7, 0);
    generate_finder(t, 0, y_max - 7);

    generate_timing_pattern_v(t, 6, 8, y_max-9);
    generate_timing_pattern_h(t, 8, 6, x_max-9);

    add_alignment_patterns(t, version-1);
    add_dark_module(t,version);
    add_version_info(t,version);

    return t;
}
