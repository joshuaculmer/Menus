# Menus

A collection of menus in various formats for my own convience.

# Inputs

## Images

Image data files (png) are stored in Inputs/images. For now, subject to change

## Raw Menus

Menu data files (md) are stored in Inputs/raw_menus.

## Recipes

Recipe data files (rtk) are stored in Inputs/recipes.

# Template Menus

Scripts can reference a template that will dictate the format of the pdf/html for printable/interactable menus respectively.

# Outputs

## Printable Menus

Printable menus are compiled from a raw menu md file in /menus_raw and located in /menus_printable

## Interactable Menus

The interactable Menus are also compiled from a raw menu md file in /menus_raw but it outputs a html file with embedded js to enable users to click on various items and then view the recipe.

## Html Intermediary

When creating outputs, an html intermediary file is made as part of the conversion process.

# Scripts

Contains the scripts to compile raw menus, recipes, and images into the printable and interactable menus. 
