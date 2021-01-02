import multi from '@rollup/plugin-multi-entry';
import replace from '@rollup/plugin-replace';
import { terser } from "rollup-plugin-terser";

export default [{
    input: "src/**/*.js",
    external: [ 'coreutil_v1','xmlparser_v1','mindi_v1','containerbridge_v1' ],
    output: {
        name: 'justright_core_v1',
        file: "dist/jsm/justright_core_v1.js",
        sourcemap: "inline",
        format: "es"
    },
    plugins: [
        multi(),
        replace({
            'coreutil_v1': 'coreutilv1',
            'xmlparser_v1': 'xmlparserv1',
            'mindi_v1': 'mindiv1',
            'containerbridge_v1': 'containerbridgev1',

            'coreutilv1': './coreutil_v1.js',
            'xmlparserv1': './xmlparser_v1.js',
            'mindiv1': './mindi_v1.js',
            'containerbridgev1': './containerbridge_v1.js'
        })
    ]
},{
    input: "src/**/*.js",
    external: [ 'coreutil_v1','xmlparser_v1','mindi_v1','containerbridge_v1' ],
    output: {
        name: 'justright_core_v1',
        file: "dist/jsm/justright_core_v1.min.js",
        format: "es"
    },
    plugins: [
        multi(),
        replace({
            coreutil_v1: 'coreutil_v1',
            xmlparser_v1: 'xmlparser_v1',
            mindi_v1: 'mindi_v1',
            containerbridge_v1: 'containerbridge_v1'
        }),
        terser()
    ]
},{
    input: "src/**/*.js",
    external: [ 'coreutil_v1','xmlparser_v1','mindi_v1','containerbridge_v1' ],
    output: {
        name: 'justright_core_v1',
        file: "dist/cjs/justright_core_v1.js",
        sourcemap: "inline",
        format: "cjs"
    },
    plugins: [
        multi()
    ]
}];