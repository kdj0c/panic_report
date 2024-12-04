// SPDX-License-Identifier: MIT

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

var main_div = document.getElementById('main');

/*
 * Encoding, same as Fido2 specification.
 * v6.14+
 */
function numbers_to_data2(numbers) {
        /* 17 decimal digits are converted to 7 bytes */
        let main_len = Math.floor(numbers.length / 17) * 7;
        /* and the remainings bytes */
        let rem_len = Math.floor((numbers.length % 17) + 2 / 3);

        let data = new Uint8Array(main_len + rem_len);
        let offset = 0;

        for (var i = 0; i < numbers.length; i += 17) {
                let chunk = numbers.substring(i, i + 17);
                let num = BigInt(chunk);
                let num_bytes = 7;
                if (chunk.len < 17) {
                        num_bytes = rem_len;
                }
                for (var j = 0; j < num_bytes; j++) {
                        data[offset] = Number(num % 256n);
                        num = num / 256n;
                        offset++;
                }
        }
        return data;
}

/*
 * Legacy encoding, found in v6.10 to v6.13
 */
function numbers_to_data(numbers) {
        const num_chars_to_bits = [0, 4, 7, 10, 13];
        const length_in_bits = Math.floor(numbers.length / 4) * 13 + num_chars_to_bits[numbers.length % 4];
        const length_in_bytes = length_in_bits / 8;
        const extra = length_in_bits % 8;
        let data = new Uint8Array(length_in_bytes);

        let offset = 0;
        let byte_off = 0;
        let rem = 0;

        for (var i = 0; i < numbers.length; i += 4) {
                let chunk = numbers.substring(i, i + 4);
                let num = Number(chunk);
                let new_length = num_chars_to_bits[chunk.length];

                let b = offset + new_length;
                if (byte_off * 8 + b >= length_in_bytes * 8) {
                        console.log("last chunk", b);
                        b -= extra;
                }
                if (b < 8) {
                        rem += num << (8 - b);
                        offset = b;
                } else if (b < 16) {
                        data[byte_off] = rem + (num >> (b - 8));
                        byte_off++;
                        rem = (num << (16 - b)) & 0xff;
                        offset = (b - 8);
                } else {
                        data[byte_off] = rem + (num >> (b - 8));
                        byte_off++;
                        data[byte_off] = num >> (b - 16);
                        byte_off++;
                        rem = num << (24 - b) & 0xff;
                        offset = (b - 16);
                }
        }
        return data;
}

function add_info(name, param) {
        const value = urlParams.get(param);
        if (value) {
                div = document.createElement("div");
                n = document.createElement("b");
                n.innerHTML = name + ": ";
                div.appendChild(n);
                div.appendChild(document.createTextNode(value));
                main_div.appendChild(div);
        }
}

function add_data(data) {
	uncompressed = pako.inflate(new Uint8Array(data));
	text = String.fromCharCode.apply(null, uncompressed);

	kmsg = document.createElement("pre");
	kmsg.appendChild(document.createTextNode(text));
	main_div.appendChild(kmsg);
}

add_info("Arch", "a");
add_info("Version", "v");
add_info("Distribution", "d");

const numbers = urlParams.get("z");
const legacy_numbers = urlParams.get("zl")
if (numbers) {
	data = numbers_to_data2(numbers);
	add_data(data);
} else if (legacy_numbers) {
	data = numbers_to_data(legacy_numbers);
	add_data(data);
}
