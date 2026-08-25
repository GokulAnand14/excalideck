// Prevents additional console window on Windows when launching the application
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    excalideck_lib::run();
}
