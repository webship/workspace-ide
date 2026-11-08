Feature: The Web IDE plugin
  Once the plugin is activated, every project row carries the IDE menu, and the Plugins page lists
  the plugin with its four steps.

  Scenario: A project row offers the IDE menu
    Given I am on "/dev"
     Then the element ".act-menu-ide" should be displayed
      And I should see "IDE"

  Scenario: The plugin is listed on the Plugins page
    Given I am on "/settings/plugins"
     Then I should see "Web IDE"
      And I should see "@webship.co/workspace-ide"
