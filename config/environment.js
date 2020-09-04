import argparse from 'command-line-args';

const default_args = [
    { name: 'verbose', alias: 'v', type: Boolean },
    { name: 'env', type: String, defaultOption: 'dev' }
];

const default_options = {
    partial: true
};

export const GetComandArgs = function() {
    const args = argparse(default_args, default_options);
    return args;
};

export function GetEnvironment() {
    const cmd_args = GetComandArgs();
    return (cmd_args.env || 'dev');
}

export const SetCommandArgs = function(app) {
    const args = GetComandArgs();
    for(const argname in args) {
        app.set(argname, args[argname]);
    }
}

export function IsProduction() {
    return GetEnvironment() == 'prod';
}

export function IsDevelopment() {
    return GetEnvironment() == 'dev';
}